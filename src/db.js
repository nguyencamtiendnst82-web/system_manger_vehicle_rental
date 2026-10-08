import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

console.log('Dang ket noi MySQL...');

connection.connect(function(error) {

    if (error) {
        console.log('Ket noi that bai!');
        console.log(error.message);
        return;
    }

    console.log('Ket noi MySQL thanh cong!');

    const sql = 'SELECT * FROM bao_tri';

    connection.query(sql, function(error, results) {

        if (error) {
            console.log('Loi truy van!');
            console.log(error.message);
            return;
        }

        console.log('Du lieu bang bao_tri:');

        console.log(results);

        connection.end();
    });
});