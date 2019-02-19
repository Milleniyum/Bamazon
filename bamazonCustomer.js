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
        getInventory();
    } else {
        throw err;
    }
});

function buy() {
    inquirer.prompt([{
            type: 'input',
            name: 'id',
            message: 'Enter the item ID of the product you want to buy:',
            validate: function(value) {
                if (isNaN(value) == false) {
                    return true;
                } else {
                    return false;
                };
            }
        },
        {
            type: 'input',
            name: 'quantity',
            message: 'How many would you like to buy?',
            validate: function(value) {
                if (isNaN(value) == false) {
                    return true;
                } else {
                    return false;
                };
            }
        }
    ]).then(function(answer) {
        connection.query('SELECT * FROM products WHERE ?', [{ item_id: answer.id }], function(err, res) {
            if (err) throw err;
            if (res.length == 0) {
                console.log('The entered item ID does not exist! Please try again.');
                buy();
            } else {
                if (res[0].stock_quantity < answer.quantity) {
                    console.log(chalk.red('Insufficient quantity! Current stock is ' + res[0].stock_quantity + '.'));
                    buy();
                } else {
                    connection.query('UPDATE products SET ? WHERE ?', [{
                            stock_quantity: res[0].stock_quantity - answer.quantity,
                            product_sales: res[0].product_sales + (res[0].price * parseInt(answer.quantity))
                        },
                        {
                            item_id: answer.id
                        }
                    ], function(err) {
                        if (err) throw err;
                        console.log(chalk.yellow('\nOrder complete! Your total purchase is $' + (answer.quantity * res[0].price).toFixed(2) + '\n'));
                        inquirer.prompt({
                            type: 'confirm',
                            name: 'continue',
                            message: 'Would you like to buy another product?'
                        }).then(function(answer) {
                            if (answer.continue) {
                                getInventory();
                            } else {
                                console.log(chalk.yellow('\nThank you for shopping with ') + chalk.blue('Bamazon!\n'));
                                connection.end();
                            };
                        });
                    });
                };
            };
        });
    });
};

function displayInventory(res) {
    var colHead1 = 'Item ID';
    var colHead2 = 'Product';
    var colHead3 = 'Department';
    var colHead4 = 'Price';
    //Set object column values to defaults for 'Item ID', 'Product', 'Department' and 'Price' (add 4 to Price to account for dollar sign and decimal points)
    var colSize = { col1: colHead1.length, col2: colHead2.length, col3: colHead3.length, col4: colHead4.length + 4 };
    //Set column sizes for columns 2-4 if value lengths are greater than defaults
    for (var i = 0; i < res.length; i++) {
        if (res[i].product_name.length > colSize.col2) colSize.col2 = res[i].product_name.length;
        if (res[i].department_name.length > colSize.col3) colSize.col3 = res[i].department_name.length;
        if (res[i].price.length > colSize.col4) colSize.col4 = res[i].price.length;
    }
    //Display headers and dashes underneath
    console.log(chalk.yellow('\n' + colHead1 + ' '.repeat(colSize.col1 - colHead1.length + 1) +
        colHead2 + ' '.repeat(colSize.col2 - colHead2.length + 1) +
        colHead3 + ' '.repeat(colSize.col3 - colHead3.length + 1) +
        colHead4));
    console.log('-'.repeat(colSize.col1) + ' ' + '-'.repeat(colSize.col2) + ' ' + '-'.repeat(colSize.col3) + ' ' + '-'.repeat(colSize.col4));
    //Display row data
    for (var i = 0; i < res.length; i++) {
        console.log(chalk.green(res[i].item_id + ' '.repeat(colSize.col1 - res[i].item_id.toString().length + 1)) + res[i].product_name + ' '.repeat(colSize.col2 - res[i].product_name.length + 1) + res[i].department_name + ' '.repeat(colSize.col3 - res[i].department_name.length + 1) + chalk.blue('$' + res[i].price.toFixed(2)));
    };
    console.log(chalk.yellow('\nPress Control+C to exit.\n'));
    buy();
};

function getInventory() {
    connection.query('SELECT item_id, product_name, department_name, price FROM products INNER JOIN departments ON (products.department_id = departments.department_id)', function(err, res) {
        if (err) throw err;
        displayInventory(res);
    });
};