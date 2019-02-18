CREATE DATABASE bamazon_db;

USE bamazon_db;

CREATE TABLE departments (
  department_id int(10) NOT NULL AUTO_INCREMENT,
  department_name varchar(50) NOT NULL,
  over_head_costs decimal(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (department_id)
);

CREATE TABLE products (
  item_id int(10) NOT NULL AUTO_INCREMENT,
  product_name varchar(50) NOT NULL,
  department_id int(10) DEFAULT NULL,
  price decimal(10,2) NOT NULL DEFAULT 0.00,
  stock_quantity int(11) NOT NULL DEFAULT 0,
  product_sales decimal(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (item_id)
);

