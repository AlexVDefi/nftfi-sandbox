const { buildLenders } = require('./buildLenders.js');
const { buildLoans } = require('./buildLoans.js');
const { buildClosedLoans } = require('./buildClosedLoans.js');

async function populateDb() {
  try {
    console.log('Starting buildLenders...');
    await buildLenders();
    console.log('Finished buildLenders.');

    console.log('Starting buildLoans...');
    await buildLoans();
    console.log('Finished buildLoans.');

    console.log('Starting buildClosedLoans...');
    await buildClosedLoans();
    console.log('Finished buildClosedLoans.');
  } catch (error) {
    console.error('Error executing functions:', error);
  }
}

populateDb();
