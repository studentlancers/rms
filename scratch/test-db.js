const { Client } = require("pg");

const passwordsToTest = ["postgres", "admin", "root", "1234", "123456", "password", ""];

async function testConnection() {
  for (const pwd of passwordsToTest) {
    const connectionString = `postgresql://postgres:${pwd}@localhost:5432/postgres`;
    const client = new Client({ connectionString });
    try {
      await client.connect();
      console.log(`SUCCESS_PASSWORD: ${pwd}`);
      await client.end();
      return pwd;
    } catch (err) {
      // Failed, continue
    }
  }
  console.log("FAILED_ALL_COMMON_PASSWORDS");
  return null;
}

testConnection();
