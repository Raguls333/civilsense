import initSqlJs from 'sql.js';

async function test() {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run("CREATE TABLE test (id INT, name TEXT);");
  db.run("INSERT INTO test VALUES (?, ?);", [1, 'CivilSense OS']);
  const res = db.exec("SELECT * FROM test;");
  console.log('SQL.JS SUCCESS:', JSON.stringify(res));
}

test().catch(console.error);
