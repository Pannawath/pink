const fs = require('node:fs');

function parseAttributes(attributeString) {
  const attributeMap = {};
  if (!attributeString) {
    return attributeMap;
  }
  const attributePattern = /([a-zA-Z0-9_:-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let matchGroup = attributePattern.exec(attributeString);
  while (matchGroup !== null) {
    const attributeName = matchGroup[1].toLowerCase();
    const attributeValue = matchGroup[2] ?? matchGroup[3] ?? matchGroup[4] ?? '';
    attributeMap[attributeName] = attributeValue;
    matchGroup = attributePattern.exec(attributeString);
  }
  return attributeMap;
}

function createDomNode(tagName, attributeMap, parentNode) {
  const classString = attributeMap.class || '';
  const classTokens = classString.split(/\s+/).filter(Boolean);
  return {
    tagName: tagName.toLowerCase(),
    attributes: attributeMap,
    id: attributeMap.id || null,
    classList: classTokens,
    children: [],
    parentNode: parentNode || null
  };
}

function parseHtmlDocument(rawHtmlText) {
  const rootNode = { tagName: '#document', attributes: {}, classList: [], children: [], parentNode: null };
  const tagScanner = /<\/?([a-zA-Z0-9:-]+)([^>]*?)>/g;
  let currentNode = rootNode;
  let matchToken = tagScanner.exec(rawHtmlText);
  const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

  while (matchToken !== null) {
    const fullTag = matchToken[0];
    const rawTagName = matchToken[1].toLowerCase();
    const rawAttrs = matchToken[2];
    const isClosing = fullTag.startsWith('</');
    const isSelfClosing = rawAttrs.endsWith('/') || voidTags.has(rawTagName);

    if (isClosing) {
      if (currentNode.parentNode) {
        currentNode = currentNode.parentNode;
      }
    } else {
      const attributeMap = parseAttributes(rawAttrs);
      const childNode = createDomNode(rawTagName, attributeMap, currentNode);
      currentNode.children.push(childNode);
      if (!isSelfClosing) {
        currentNode = childNode;
      }
    }
    matchToken = tagScanner.exec(rawHtmlText);
  }
  return rootNode;
}

function findNodeById(startingNode, targetId) {
  if (startingNode.id === targetId) {
    return startingNode;
  }
  for (const childNode of startingNode.children) {
    const matchingNode = findNodeById(childNode, targetId);
    if (matchingNode) {
      return matchingNode;
    }
  }
  return null;
}

function collectNodesByClass(startingNode, targetClass, matchingList = []) {
  if (startingNode.classList && startingNode.classList.includes(targetClass)) {
    matchingList.push(startingNode);
  }
  for (const childNode of startingNode.children) {
    collectNodesByClass(childNode, targetClass, matchingList);
  }
  return matchingList;
}

function collectNodesByTag(startingNode, targetTagName, matchingList = []) {
  if (startingNode.tagName === targetTagName.toLowerCase()) {
    matchingList.push(startingNode);
  }
  for (const childNode of startingNode.children) {
    collectNodesByTag(childNode, targetTagName, matchingList);
  }
  return matchingList;
}

function loadDocument(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return parseHtmlDocument(fileContent);
}

module.exports = {
  parseAttributes,
  parseHtmlDocument,
  findNodeById,
  collectNodesByClass,
  collectNodesByTag,
  loadDocument
};
