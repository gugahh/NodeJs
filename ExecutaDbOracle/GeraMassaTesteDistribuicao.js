const oracledb = require('oracledb');

var myArgs = process.argv.slice(2);
console.log('myArgs: ', myArgs);
var p_usuario;
var p_senha;

if (!Array.isArray(myArgs) || myArgs.length != 2) {
  console.error("Devem ser informados usuario e senha (do banco) como parametros.");
  process.exit();
}

p_usuario = myArgs[0];
p_senha = myArgs[1];

console.log("\nUsuario: \t" + p_usuario + "\nSenha: \t\t(Foi atribuída)."  + "\n");

async function run() {

  let connection;

  try {

    connection = await oracledb.getConnection(
            { 
                user: p_usuario, 
                password: p_senha,
                connectionString: "10.0.251.32/CORR" 
            }
        );

    console.log("Successfully connected to Oracle Database");


    result = await connection.execute(
        `Select SYSDATE From DUAL`,
        [],
        { resultSet: true, outFormat: oracledb.OUT_FORMAT_OBJECT });
  
      const rs = result.resultSet;
      let row;
  
      while ((row = await rs.getRow())) {
        if (row.DONE)
          console.log(row);
        else
          console.log(row);
      }
  
      await rs.close();

    // Create a table
/*
    await connection.execute(`begin
                                execute immediate 'drop table todoitem';
                                exception when others then if sqlcode <> -942 then raise; end if;
                              end;`);

    await connection.execute(`create table todoitem (
                                id number generated always as identity,
                                description varchar2(4000),
                                creation_ts timestamp with time zone default current_timestamp,
                                done number(1,0),
                                primary key (id))`);

    // Insert some data

    const sql = `insert into todoitem (description, done) values(:1, :2)`;

    const rows =
          [ ["Task 1", 0 ],
            ["Task 2", 0 ],
            ["Task 3", 1 ],
            ["Task 4", 0 ],
            ["Task 5", 1 ] ];

    let result = await connection.executeMany(sql, rows);

    console.log(result.rowsAffected, "Rows Inserted");

    connection.commit();

    // Now query the rows back

    result = await connection.execute(
      `select description, done from todoitem`,
      [],
      { resultSet: true, outFormat: oracledb.OUT_FORMAT_OBJECT });

    const rs = result.resultSet;
    let row;

    while ((row = await rs.getRow())) {
      if (row.DONE)
        console.log(row.DESCRIPTION, "is done");
      else
        console.log(row.DESCRIPTION, "is NOT done");
    }

    await rs.close();

    */

  } catch (err) {
    console.error(err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
}

run();
