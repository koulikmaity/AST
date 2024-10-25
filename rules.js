const express = require ('express');
const Node = require('../models/AST');
const Rule = require('../models/Rule');
const router = express.Router();




const createASTFromRuleString = (ruleString) => {
    try {
        ruleString = ruleString.trim();
        console.log(`Parsing rule: ${ruleString}`);

        // Remove surrounding parentheses if present
        if (ruleString.startsWith('(') && ruleString.endsWith(')')) {
            ruleString = ruleString.slice(1, -1).trim();
            console.log(`Removed outer parentheses: ${ruleString}`);
        }

        let parenthesesCount = 0;
        let operator = null;
        let operatorIndex = -1;

        // Find the first 'AND' or 'OR' that is outside of any parentheses
        for (let i = 0; i < ruleString.length; i++) {
            const char = ruleString[i];

            if (char === '(') {
                parenthesesCount++;
            } else if (char === ')') {
                parenthesesCount--;
            }

            // Look for 'AND' or 'OR' only if we are not inside parentheses
            if (parenthesesCount === 0) {
                if (ruleString.substring(i, i + 3) === 'AND') {
                    operator = 'AND';
                    operatorIndex = i;
                    break;
                } else if (ruleString.substring(i, i + 2) === 'OR') {
                    operator = 'OR';
                    operatorIndex = i;
                    break;
                }
            }
        }

        // If an operator is found, split the rule string into left and right parts
        if (operator) {
            const leftPart = ruleString.substring(0, operatorIndex).trim();
            const rightPart = ruleString.substring(operatorIndex + operator.length).trim();

            console.log(`Found operator: ${operator}`);
            console.log(`Left part: ${leftPart}`);
            console.log(`Right part: ${rightPart}`);

            // Create a new operator node and recursively create the left and right subtrees
            const root = new Node('operator', operator);
            root.left = createASTFromRuleString(leftPart);
            root.right = createASTFromRuleString(rightPart);

            return root;
        }

        // If no operator is found, return a simple operand node (leaf)
        console.log(`Operand detected: ${ruleString}`);
        return new Node('operand', ruleString);
    } catch (error) {
        console.error(`Error parsing rule: ${error.message}`);
        throw new Error(`Error parsing rule string: ${error.message}`);
    }
};













// Create Rule (Converts a rule string into an AST)


router.post('/create-rule', async (req, res) => {
    const { ruleString } = req.body;
    // console.log(ruleString);

    try {
        // Parse rule string into AST
        const ast = createASTFromRuleString(ruleString);

        // Save the rule and AST in MongoDB
        const rule = new Rule({ ruleString, ast });
        await rule.save();

        res.status(201).json({ message: 'Rule created successfully', ast });
    } catch (error) {
        console.error('Error in create-rule:', error.message);
        res.status(400).json({ error: `Failed to create rule: ${error.message}` });
    }
});










router.post('/combine-rules', async (req, res) => {
    const { rules, operator } = req.body;  // Array of rules and the operator (AND/OR)
    
    // Check if rules and operator are valid
    if (!rules || !Array.isArray(rules) || rules.length < 2) {
        return res.status(400).json({ error: 'Please provide at least two rules to combine.' });
    }

    if (!operator || (operator !== 'AND' && operator !== 'OR')) {
        return res.status(400).json({ error: 'Please provide a valid operator (AND/OR).' });
    }

    try {
        console.log('Combining rules:', rules);

        // Start combining rules
        let combinedAST = rules[0].ast;  // Take the first rule's AST as the base

        // Iterate through the remaining rules and combine them
        for (let i = 1; i < rules.length; i++) {
            const currentAST = rules[i].ast;  // Get the AST of the current rule
            console.log(`Combining rule ${i}:`, currentAST);

            // Create a new AST with the provided operator
            let newAST = new Node('operator', operator);
            newAST.left = combinedAST;      // Left part is the current combined AST
            newAST.right = currentAST;      // Right part is the current rule's AST

            // Update combinedAST to the newly created one
            combinedAST = newAST;
        }

        // Return the combined AST
        res.status(200).json({ message: 'Rules combined successfully', combinedAST });
    } catch (error) {
        console.error('Error combining rules:', error.message);
        res.status(500).json({ error: 'Failed to combine rules', details: error.message });
    }
});









router.post('/evaluate-rule', async (req, res) => {
    const { ast, data } = req.body;

    if (!ast || !data) {
        return res.status(400).json({ error: 'Please provide a valid AST and data for evaluation.' });
    }

    try {
        // Function to recursively evaluate the AST
        const evaluateAST = (node, data) => {
            if (node.nodeType === 'operand') {
                // Evaluate the condition as a simple comparison (e.g., "age > 30")
                const condition = node.value;
                const [field, operator, value] = condition.split(' ');

                switch (operator) {
                    case '>':
                        return data[field] > parseFloat(value);
                    case '<':
                        return data[field] < parseFloat(value);
                    case '=':
                        return data[field] === value.replace(/['"]/g, '');  // Remove quotes for string comparison
                    default:
                        throw new Error(`Unsupported operator: ${operator}`);
                }
            } else if (node.nodeType === 'operator') {
                // Recursively evaluate the left and right nodes
                const leftResult = evaluateAST(node.left, data);
                const rightResult = evaluateAST(node.right, data);

                switch (node.value) {
                    case 'AND':
                        return leftResult && rightResult;
                    case 'OR':
                        return leftResult || rightResult;
                    default:
                        throw new Error(`Unsupported operator: ${node.value}`);
                }
            }
        };

        // Evaluate the AST
        const result = evaluateAST(ast, data);

        // Return the evaluation result
        res.status(200).json({ result });
    } catch (error) {
        console.error('Error evaluating rule:', error.message);
        res.status(500).json({ error: 'Failed to evaluate rule' });
    }
});











module.exports = router;