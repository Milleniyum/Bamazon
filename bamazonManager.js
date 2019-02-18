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
        choices: ['View Products for Sale', 'View Low Inventory', 'Add to Inventory', 'Add New Product', 'Exit']
    }).then(function(answer) {
        switch (answer.choice) {
            case 'View Products for Sale':
                viewInventory(false);
                break;

            case 'View Low Inventory':
                viewInventory(true);
                break;

            case 'Add to Inventory':
                addInventory();
                break;

            case 'Add New Product':
                addNewProduct();
                break;

            case 'Exit':
                connection.end();
        };
    });
};

function addNewProduct() {
    inquirer.prompt([{
        type: 'input',
        name: 'product',
        message: 'Please enter the product name:',
        validate: function(value) {
            if (value.trim() == '') {
                return false;
            } else {
                return true;
            };
        }
    }, {
        type: 'input',
        name: 'department',
        message: 'Please enter the department ID:',
        validate: function(value) {
            if (isNaN(value) == false) {
                return true;
            } else {
                return false;
            };
        }
    }, {
        type: 'input',
        name: 'price',
        message: 'Please enter the price:',
        validate: function(value) {
            if (isNaN(value) == false) {
                return true;
            } else {
                return false;
            };
        }
    }, {
        type: 'input',
        name: 'quantity',
        message: 'Please enter the stock quantity:',
        validate: function(value) {
            if (isNaN(value) == false) {
                return true;
            } else {
                return false;
            };
        }
    }]).then(function(answers) {
        connection.query('SELECT product_name FROM products WHERE product_name = ?', [answers.product], function(err, res) {
            if (err) throw err;
            if (res.length > 0) {
                console.log(chalk.red('\nThe product name ') + chalk.yellow(answers.product) + chalk.red(' already exists!\n'));
                menu();
            } else {
                connection.query('INSERT INTO products (product_name, department_id, price, stock_quantity) VALUES (?, ?, ?, ?)', [answers.product, answers.department, answers.price, answers.quantity], function(err) {
                    if (err) throw err;
                    console.log(chalk.yellow('\nProduct added successfully!\n'));
                    menu();
                });
            };
        });
    });
};

function addInventory() {
    inquirer.prompt({
        type: 'input',
        name: 'id',
        message: 'Please enter the item ID to add inventory:',
        validate: function(value) {
            if (isNaN(value) == false) {
                return true;
            } else {
                return false;
            };
        }
    }).then(function(item) {
        connection.query('SELECT * FROM products WHERE ?', [{ item_id: item.id }], function(err, res) {
            if (err) throw err;
            if (res.length == 0) {
                console.log(chalk.red('\nThe entered item ID does not exist! Please try again.\n'));
                menu();
            } else {
                inquirer.prompt({
                    type: 'confirm',
                    name: 'correct',
                    message: 'Is ' + res[0].product_name + ' the product you want to update?'
                }).then(function(answer) {
                    if (answer.correct) {
                        inquirer.prompt({
                            type: 'input',
                            name: 'amount',
                            message: 'Please enter the amount of inventory to add:',
                            validate: function(value) {
                                if (isNaN(value) == false) {
                                    return true;
                                } else {
                                    return false;
                                };
                            }
                        }).then(function(answer) {
                            connection.query('UPDATE products SET ? WHERE ?', [{
                                    stock_quantity: res[0].stock_quantity + parseInt(answer.amount)
                                },
                                {
                                    item_id: item.id
                                }
                            ], function(err) {
                                if (err) throw err;
                                console.log(chalk.yellow('\nInventory updated! The new inventory total is ' + (res[0].stock_quantity + parseInt(answer.amount)) + '.\n'));
                                menu();
                            });
                        });
                    } else {
                        menu();
                    };
                });
            };
        });
    })
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
    console.log('\n');
    menu();
};

function viewInventory(low) {
    var select = 'SELECT item_id, product_name, department_name, price FROM products INNER JOIN departments ON (products.department_id = departments.department_id)';
    if (low) select += ' WHERE stock_quantity < 5';

    connection.query(select, function(err, res) {
        if (err) throw err;
        displayInventory(res);
    });
};