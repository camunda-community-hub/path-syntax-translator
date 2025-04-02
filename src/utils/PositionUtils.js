function isRootScope(scopes) {
  return scopes.length == 1;
}

export function isPositionClosedStartOfFragmentWithoutScopeChange(prevLine) {
  return prevLine == null || isLineEmpty(prevLine);
}

export function isPositionRootScopeClosedStartOfFragmentWithoutScopeChange(
  prevLine,
  scopes
) {
  return (
    isRootScope(scopes) &&
    isPositionClosedStartOfFragmentWithoutScopeChange(prevLine)
  );
}

export function isPositionStartOfSubprocess(prevPrevLine, prevLine) {
  return (
    prevLine?.activityType == "SubProcess" &&
    !prevLine?.triggeredByEvent &&
    !(prevPrevLine?.type == "fragmentBorder")
  );
}

export function isPositionStartOfEventSubprocess(prevPrevLine, prevLine) {
  return (
    prevLine?.activityType == "SubProcess" &&
    prevLine?.triggeredByEvent &&
    !(prevPrevLine?.type == "fragmentBorder")
  );
}

export function isPositionWithinFragment(prevLine, currentLine, nextLine) {
  return (
    !isLineEmpty(prevLine) &&
    (!isLineFragmentBorder(prevLine) ||
      prevLine?.scopeLevel > currentLine.scopeLevel) &&
    !isLineEmpty(nextLine) &&
    !isLineFragmentBorder(nextLine) &&
    // prevLine?.scopeLevel == currentLine.scopeLevel &&
    currentLine.scopeLevel == nextLine?.scopeLevel
  );
}

export function isPositionWithinFragmentWithScopeChange(
  prevLine,
  currentLine,
  nextLine
) {
  return (
    !isLineEmpty(prevLine) &&
    !isLineEmpty(nextLine) &&
    prevLine?.scopeLevel == currentLine.scopeLevel &&
    currentLine.scopeLevel < nextLine?.scopeLevel
  );
}

export function isPositionClosedEndOfFragment(currentLine, nextLine) {
  return (
    nextLine == null ||
    nextLine.type == "empty" ||
    isScopeDecrease(currentLine, nextLine)
  );
}

export function isScopeDecrease(currentLine, nextLine) {
  return currentLine?.scopeLevel > nextLine?.scopeLevel;
}

export function isLineEmpty(line) {
  return line?.type == "empty";
}

export function isLineFragmentBorder(line) {
  return line?.type == "fragmentBorder";
}

export function isLineKnot(line) {
  return line?.type == "knot";
}

export function hasLineGatewayType(line, gatewayType) {
  return line?.gatewayType == gatewayType;
}
