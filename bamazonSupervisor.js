var mysql = require('mysql');
var inquirer = require('inquirer');
var chalk = require('chalk');

var connection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root',
    database: 'bamazon_db'
});

connection.connect(function(err) {
    if (!err) {
        console.log('Connected as id: ' + connection.threadId);
        menu();
    } else {
        throw err;
    }
});

function menu() {
    inquirer.prompt({
        type: 'rawlist',
        name: 'choice',
        message: 'Select an option:',
        choices: ['View Product Sales by Department', 'Create New Department', 'Exit']
    }).then(function(answer) {
        switch (answer.choice) {
            case 'View Product Sales by Department':
                viewProductSalesbyDept();
                break;

            case 'Create New Department':
                createNewDepartment();
                break;

            case 'Exit':
                connection.end();
        };
    });
};

function createNewDepartment() {
    inquirer.prompt([{
        type: 'input',
        name: 'department',
        message: 'Please enter the department name:',
        validate: function(value) {
            if (value.trim() == '') {
                return false;
            } else {
                return true;
            };
        }
    }, {
        type: 'input',
        name: 'costs',
        message: 'Please enter the overhead costs:',
        validate: function(value) {
            if (isNaN(value) == false) {
                return true;
            } else {
                return false;
            };
        }
    }]).then(function(answers) {
        connection.query('SELECT department_name FROM departments WHERE department_name = ?', [answers.department], function(err, res) {
            if (err) throw err;
            if (res.length > 0) {
                console.log(chalk.red('\nThe department name ') + chalk.yellow(answers.department) + chalk.red(' already exists!\n'));
                menu();
            } else {
                connection.query('INSERT INTO departments (department_name, over_head_costs) VALUES (?, ?)', [answers.department, answers.costs], function(err) {
                    if (err) throw err;
                    console.log(chalk.yellow('\nDepartment added successfully!\n'));
                    menu();
                });
            };
        });

    });
};

function viewProductSalesbyDept() {
    connection.query('SELECT departments.department_id, department_name, over_head_costs, IFNULL(SUM(product_sales),0) AS product_sales, (IFNULL(SUM(product_sales),0) - over_head_costs) AS total_profit FROM departments LEFT JOIN products ON (departments.department_id = products.department_id) GROUP BY department_id', function(err, res) {
        displayProductSalesbyDept(res);
    });
};

function displayProductSalesbyDept(res) {
    var colHead1 = 'Department ID';
    var colHead2 = 'Department Name';
    var colHead3 = 'Overhead Costs';
    var colHead4 = 'Product Sales';
    var colHead5 = 'Total Profit';
    //Set object column values to defaults for 'Department ID', 'Department Name', 'Overhead Costs', 'Product Sales' and 'Total Profit'
    var colSize = { col1: colHead1.length, col2: colHead2.length, col3: colHead3.length, col4: colHead4.length, col5: colHead5.length };
    //Set column sizes for columns 2-5 if value lengths are greater than defaults
    for (var i = 0; i < res.length; i++) {
        if (res[i].department_name.length > colSize.col2) colSize.col2 = res[i].department_name.length;
        if (res[i].over_head_costs.length + 4 > colSize.col3) colSize.col3 = res[i].over_head_costs.length;
        if (res[i].product_sales.length > colSize.col4) colSize.col4 = res[i].product_sales.length;
        if (res[i].total_profit.length > colSize.col5) colSize.col5 = res[i].total_profit.length;
    }
    //Display headers and dashes underneath
    console.log(chalk.yellow('\n' + colHead1 + ' '.repeat(colSize.col1 - colHead1.length + 1) +
        colHead2 + ' '.repeat(colSize.col2 - colHead2.length + 1) +
        colHead3 + ' '.repeat(colSize.col3 - colHead3.length + 1) +
        colHead4 + ' '.repeat(colSize.col4 - colHead4.length + 1) +
        colHead5));
    console.log('-'.repeat(colSize.col1) + ' ' + '-'.repeat(colSize.col2) + ' ' + '-'.repeat(colSize.col3) + ' ' + '-'.repeat(colSize.col4) + ' ' + '-'.repeat(colSize.col5));
    //Display row data
    var total = 0;
    for (var i = 0; i < res.length; i++) {
        total += res[i].total_profit;
        var ohc = '$' + res[i].over_head_costs.toFixed(2);
        var ps = '$' + res[i].product_sales.toFixed(2);
        var tp = '$' + res[i].total_profit.toFixed(2);
        console.log(chalk.green(res[i].department_id + ' '.repeat(colSize.col1 - res[i].department_id.toString().length + 1)) + res[i].department_name + ' '.repeat(colSize.col2 - res[i].department_name.length + 1) + ohc + ' '.repeat(colSize.col3 - ohc.length + 1) + ps + ' '.repeat(colSize.col4 - ps.length + 1) + tp);
    };
    console.log(chalk.yellow('Total' + ' '.repeat((colSize.col1 - 'Total'.length) + colSize.col2 + colSize.col3 + colSize.col4 + 4) + '$' + total.toFixed(2) + '\n'));

    menu();
};