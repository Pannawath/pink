const fs = require('node:fs');

function parseDeclarations(declarationBlockText) {
  const declarationMap = {};
  if (!declarationBlockText) {
    return declarationMap;
  }
  const statementList = declarationBlockText.split(';');
  for (const singleStatement of statementList) {
    const colonIndex = singleStatement.indexOf(':');
    if (colonIndex <= 0) {
      continue;
    }
    const propertyKey = singleStatement.slice(0, colonIndex).trim().toLowerCase();
    const propertyValue = singleStatement.slice(colonIndex + 1).trim();
    if (propertyKey.length > 0) {
      declarationMap[propertyKey] = propertyValue;
    }
  }
  return declarationMap;
}

function parseRuleSet(cssBodyText) {
  const rulesList = [];
  const cleanBody = cssBodyText.replace(/\/\*[\s\S]*?\*\//g, '');
  const rulePattern = /([^{]+)\{([^}]+)\}/g;
  let ruleMatch = rulePattern.exec(cleanBody);
  while (ruleMatch !== null) {
    const selectorGroup = ruleMatch[1].trim();
    const declarationsText = ruleMatch[2].trim();
    const declarationMap = parseDeclarations(declarationsText);
    const selectorTokens = selectorGroup.split(',').map((selectorString) => selectorString.trim());
    rulesList.push({
      rawSelector: selectorGroup,
      selectors: selectorTokens,
      declarations: declarationMap
    });
    ruleMatch = rulePattern.exec(cleanBody);
  }
  return rulesList;
}

function parseStyleSheet(rawCssText) {
  const cleanCss = rawCssText.replace(/\/\*[\s\S]*?\*\//g, '');
  const mediaBlocks = [];
  const mediaPattern = /@media\s*([^{]+)\{([\s\S]*?\}\s*)\}/g;
  let mediaMatch = mediaPattern.exec(cleanCss);

  while (mediaMatch !== null) {
    const mediaCondition = mediaMatch[1].trim();
    const mediaBody = mediaMatch[2];
    const mediaRules = parseRuleSet(mediaBody);
    mediaBlocks.push({
      condition: mediaCondition,
      rules: mediaRules
    });
    mediaMatch = mediaPattern.exec(cleanCss);
  }

  const topLevelCss = cleanCss.replace(/@media\s*[^{]+\{[\s\S]*?\}\s*\}/g, '');
  const globalRules = parseRuleSet(topLevelCss);

  return {
    globalRules,
    mediaBlocks
  };
}

function findRulesForSelector(rulesCollection, targetSelector) {
  const matchingRules = [];
  for (const ruleDefinition of rulesCollection) {
    for (const selectorCandidate of ruleDefinition.selectors) {
      if (selectorCandidate === targetSelector || selectorCandidate.endsWith(targetSelector)) {
        matchingRules.push(ruleDefinition);
        break;
      }
    }
  }
  return matchingRules;
}

function getMediaBlockRules(parsedSheet, mediaConditionSubstring) {
  for (const blockEntry of parsedSheet.mediaBlocks) {
    if (blockEntry.condition.includes(mediaConditionSubstring)) {
      return blockEntry.rules;
    }
  }
  return [];
}

function loadStyleSheet(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return parseStyleSheet(fileContent);
}

module.exports = {
  parseDeclarations,
  parseRuleSet,
  parseStyleSheet,
  findRulesForSelector,
  getMediaBlockRules,
  loadStyleSheet
};
