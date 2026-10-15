const bcrypt = require('bcryptjs');
require('./dbconnect.js');
const PersonModel = require('./person_schema.js');

async function seed() {
    const existing = await PersonModel.findOne({ emailid: 'admin@gmail.com' });
    if (existing) {
        console.log('Admin already exists');
        return process.exit(0);
    }

    await PersonModel.create({
        name: 'Admin',
        emailid: 'admin@gmail.com',
        password: await bcrypt.hash('admin123', 10),
        mobile: 99999999,
        role: 'admin'
    });

    console.log('Admin created');
    process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
