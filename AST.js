class Node {
    constructor(nodeType, value = null) {
        this.nodeType = nodeType; // "operator" or "operand"
        this.value = value;       // Value for operands (like "age > 30")
        this.left = null;         // Left child node
        this.right = null;        // Right child node
    }
}

module.exports = Node;
