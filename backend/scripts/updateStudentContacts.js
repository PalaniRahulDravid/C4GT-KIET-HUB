const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const User = require('../models/User');

const studentContacts = [
  // Team 1
  { roll: '23B21A4268', name: 'Bhavani sankar', phone: '7995911766', email: 'bhavanisankaradavuluri1094@gmail.com' },
  { roll: '23JN1A4596', name: 'KOLAMURI BHAVYA SRI', phone: '8500475677', email: 'bhavyasrikolamuri@gmail.com' },
  { roll: '23B21A4541', name: 'MAMIDALA GOVIND', phone: '9391118215', email: 'mamidalagovind5599@gmail.com' },
  { roll: '23B21A4516', name: 'BOLISETTI JYOTHI SWARUPA', phone: '8019332688', email: 'swaroopa80621@gmail.com' },
  { roll: '23JN1A4331', name: 'PANASA.RAJINI', phone: '8184872788', email: 'rajini1788@gmail.com' },
  { roll: '24B21A4419', name: 'DASARI NAVEEN KUMAR', phone: '9959305514', email: 'dasarinaveenkumar277@gmail.com' },
  { roll: '24B21A4213', name: 'MALLIPUDI SATYA KRUPA', phone: '9391546652', email: 'satyakrupamallipudi@gmail.com' },
  { roll: '24JN1A4513', name: 'S . Siri Bhuvaneswari', phone: '6281414574', email: 'somarouthusiri26@gmail.com' },
  { roll: '24JN1A4591', name: 'SABBISETTY ANJANA LAKSHMI ASRITHA', phone: '8328107148', email: 'asrithaasabbisetty07@gmail.com' },

  // Team 2
  { roll: '23JN1A4534', name: 'Ashwini', phone: '8019664599', email: 'bashwindurga@gmail.com' },
  { roll: '23JN1A4215', name: 'DEVAGUPTAPU VENKATA SURYA SHANMUKHA', phone: '7981535357', email: 'shanmukha2775@gmail.com' },
  { roll: '23B21A4269', name: 'GIRIDHAR SHYAM SAMSANI', phone: '9705384535', email: 'giridharshyamsamsani@gmail.com' },
  { roll: '23B21A4591', name: 'Peddapalli Satya venkata Siva Durga Prasad', phone: '9030512334', email: 'psivadurgaprasad88@gmail.com' },
  { roll: '23JN1A4533', name: 'GANDHAM SRI LAKSHMI', phone: '6304569046', email: 'gandhamsrilakshmi59999@gmail.com' },
  { roll: '24B21A4345', name: 'BALUKULA SAMPATH', phone: '9390536794', email: 'sampaths3877@gmail.com' },
  { roll: '246Q1A4307', name: 'YUVARAJU BONDADA', phone: '7989280510', email: 'yuvarajubondada111@gmail.com' },
  { roll: '24JN1A4306', name: 'MONIKA KONA', phone: '8374129365', email: 'k.monikaa10@gmail.com' },
  { roll: '24JN1A4502', name: 'CHINTADA RAMYA SRI', phone: '6302404514', email: 'ramyasri15007@gmail.com' },

  // Team 3
  { roll: '23B21A4661', name: 'Karthik', phone: '9390756991', email: 'karthik939075@gmail.com' },
  { roll: '23B21A4225', altRoll: '23JN1A4225', name: 'Nithin Kumar Mancheela', phone: '7670924723', email: 'nithinmancheela@gmail.com' },
  { roll: '23JN1A4543', name: 'LAXMI VISALYA SABBISETTI', phone: '8639478859', email: 'lakshmivisalyasabbisetti@gmail.com' },
  { roll: '23JN1A45A1', name: 'MASAA KEERTHI', phone: '7207078483', email: 'keerthimasaa@gmail.com' },
  { roll: '23B21A4538', name: 'PECHETTI SRI RAMA CHANDRA MURTHI', phone: '8886262590', email: 'srirampechetti251@gmail.com' },
  { roll: '24JN1A4316', name: 'K HEMA SUPRIYA', phone: '9949421999', email: 'hemasupriyakari@gmail.com' },
  { roll: '24B21A4576', name: 'ACHANTA SIVA RAMA KRISHNA', phone: '7981239582', email: 'asivaramakrishna018@gmail.com' },
  { roll: '24B21A43A1', name: 'BEELA VIVEK', phone: '7207261834', email: 'beelavivek730@gmail.com' },
  { roll: '24B21A4209', name: 'BEVARA ANJILI RANI', phone: '8688754397', email: 'anjiliranibevara@gmail.com' },

  // Team 4
  { roll: '23B21A45B4', name: 'Akhil', phone: '9515233587', email: 'akhilvanama19@gmail.com' },
  { roll: '23JN1A4581', name: 'R.BALA NIKHITHA', phone: '9963508675', email: 'nikhithan172@gmail.com' },
  { roll: '23B21A4506', name: 'PAIDIKONDALA DEVI', phone: '7569830629', email: 'devipaidikondala3@gmail.com' },
  { roll: '23B21A4618', name: 'LITHIKASRAYA C', phone: '8122600058', email: 'lithikasrayac@gmail.com' },
  { roll: '24B25A4305', name: 'SAI TEJA REVURI', phone: '9154122026', email: 'steja9759@gmail.com' },
  { roll: '25B25A4516', name: 'ARIGELA DURGA SAI MANIKANTA', phone: '9515667677', email: 'arigelamanikanta2005@gmail.com' },
  { roll: '24JN1A4269', name: 'GOLUGURI KEERTHI SRI JYOTHI', phone: '7702132788', email: 'ksri01437@gmail.com' },
  { roll: '24JN1A4526', name: 'NEELAM MOUNIKA', phone: '8463999085', email: 'mounika.neelam03@gmail.com' },
  { roll: '24B21A4281', name: 'MARNI HARISH JAYARAM', phone: '6305233077', email: 'mharishjayaram77@gmail.com' },

  // Team 5
  { roll: '23JN1A45C0', name: 'Meena', phone: '8919002723', email: 'meenachittuluri@gmail.com' },
  { roll: '23B21A45A6', name: 'MANDADI NAGARATNAKAR', phone: '7981224969', email: 'nagaratnakarmandadi@gmail.com' },
  { roll: '23B21A4532', name: 'CHELLUMAHANTHI KARTHIK', phone: '8121407838', email: 'karthikch834@gmail.com' },
  { roll: '23B21A4262', name: 'KOLA SRI RAMARAJU', phone: '9666364628', email: 'sriramkola153@gmail.com' },
  { roll: '23JN1A4565', name: 'BINDUSRI TALAKONDA', phone: '8019977818', email: 'bindusri2294@gmail.com' },
  { roll: '25JN5A4204', name: 'GUNTAMUKKALA BHARATHI', phone: '7981251235', email: 'bharathiguntamukkala123@gmail.com' },
  { roll: '24B21A4410', name: 'SIRIPURAPU DEEKSHITHA', phone: '7288820073', email: 'sdeekshitha73@gmail.com' },
  { roll: '24B21A4567', name: 'TADIKALA YASWANTH KUMAR', phone: '9177031935', email: 'tadikalaeswanthkumar@gmail.com' },
  { roll: '24B21A45C4', name: 'MOTURI TEJA GANESH', phone: '9032237429', email: 'moturitejaganesh@gmail.com' },

  // Team 6
  { roll: '23B21A4546', name: 'Rahul', phone: '9059704389', email: 'rahuldravidpalani2005@gmail.com' },
  { roll: '23B21A4595', name: 'Rayudu Veera Venkata Swamy', phone: '7288819391', email: 'swamyrayudu7288@gmail.com' },
  { roll: '23B21A4565', name: 'CHINTHALAPUDI VENKATA SATYA SAI ABHISHEK', phone: '6302015687', email: 'abhi31mai@gmail.com' },
  { roll: '23B21A4558', name: 'PALIVELA LAKSHMI TARUN', phone: '6303474889', email: 'lakshmitaruntarun@gmail.com' },
  { roll: '23JN1A4314', name: 'Gattem Aruna', phone: '8008349924', email: 'gattemaruna68@gmail.com' },
  { roll: '24B21A4260', name: 'MALLA HARSHA VARDHAN', phone: '6281511653', email: 'mallaharsahvardhannaidu@gmail.com' },
  { roll: '24B21A43A5', altRoll: '24B21A4345', name: 'CHENNAMALLI SURENDRA', phone: '9652077964', email: 'surendrachennamalli177@gmail.com' },
  { roll: '24B21A4310', name: 'ROOPA SRI YENUGU', phone: '9390093667', email: 'yroopasri6@gmail.com' },
  { roll: '25B25A4420', name: 'Tharun Bole', phone: '7780388517', email: 'gowdatharthun692@gmail.com' },

  // Team 7
  { roll: '23B21A4311', name: 'Charan', phone: '9182242104', email: 'charannaidukumpatla104@gmail.com' },
  { roll: '23B21A4265', name: 'Thumpala Haribabu', phone: '9392393340', email: 'thumpalaharibabu@gmail.com' },
  { roll: '23B21A4202', name: 'TAMMANA SRI LAKSHMI VASANTHI', phone: '8374144515', email: 'vasanthitammana56@gmail.com' },
  { roll: '23JN1A4550', name: 'GOPISETTI HEMA SAI DEEPTHI', phone: '9618512758', email: 'gopisettideepu@gmail.com' },
  { roll: '23B21A4301', name: 'MOKA DIVYA', phone: '8885793625', email: 'divyamoka7511@gmail.com' },
  { roll: '24JN1A4506', name: 'BEPALA PURNIMA', phone: '8074376562', email: 'purnimareddy0026@gmail.com' },
  { roll: '24B21A4577', name: 'Veeramsetti Y N D Sanjay Bhargav', phone: '6303191968', email: 'sanjaybhargav0005@gmail.com' },
  { roll: '25B25A4205', name: 'MOTURI LALITHA SOWJANYA', phone: '9589677166', email: 'moturilalithasowjanya@gmail.com' },
  { roll: '24B21A4494', name: 'KADIYALA MANI NAGA VENKATESH', phone: '8106916455', email: 'kadiyalamani5678@gmail.com' },

  // Team 8
  { roll: '23B21A4304', name: 'Sanjeetha', phone: '8977621830', email: 'sanjeetha18@gmail.com' },
  { roll: '23B21A4348', name: 'KATTEBOINA RAVI TEJA', phone: '6305730848', email: 'katteboinaraviteja21@gmail.com' },
  { roll: '23JN1A4510', name: 'ACHANTA VEERA KUMARI', phone: '9346136606', email: 'vkachanta9346@gmail.com' },
  { roll: '23JN1A45E0', name: 'NARUKULA DEVI', phone: '9849069626', email: 'devivarshinanarukula2005@gmail.com' },
  { roll: '23B21A4205', name: 'YANDAPALLI SAI VARSHITHA', phone: '9989096389', email: 'saivarshithayandapalli@gmail.com' },
  { roll: '24JN1A4505', name: 'AKSHAYA JOGA', phone: '6305643361', email: 'akshayajoga28@gmail.com' },
  { roll: '25JN5A4202', name: 'D.GANGA BHAVANI', phone: '9502224398', email: 'dasarigangabhavani81@gmail.com' },
  { roll: '24B21A4256', name: 'HARSHA VARDHAN ARIPAKA', phone: '9701368489', email: 'aripakaharshavardhan09@gmail.com' },
  { roll: '25B25A4238', name: 'RAPARTHI DURGA VENKATA MANIKANTA', phone: '9866655334', email: 'manikantaraparthi71@gmail.com' },

  // Team 9
  { roll: '23B21A4368', name: 'Aditya', phone: '8121124042', email: 'nadipilliaditya7@gmail.com' },
  { roll: '23JN1A4211', name: 'YELLAPU JAYASREE', phone: '7842845423', email: 'jayasreeyellapu6475@gmail.com' },
  { roll: '23B21A4297', name: 'Velaga Sai Chandu', phone: '9989408479', email: 'sunnyvelega219@gmail.com' },
  { roll: '23B21A4378', name: 'Alapati Avinash', phone: '7780139348', email: 'avinashalapati11@gmail.com' },
  { roll: '23B21A4323', name: 'Puligedda Naga Sri Verra Varun', phone: '8639797478', email: 'pulligeddanagasriveeravarun@gmail.com' },
  { roll: '25JN5A4201', name: 'ANKAMREDDI TEJASRI', phone: '7995304085', email: 'ankamredditejasri05@gmail.com' },
  { roll: '25B25A4512', name: 'KAMBHAMPATI NAVEEN', phone: '6281841399', email: 'kambhampatinaveen5@gmail.com' },
  { roll: '25B25A4203', name: 'SEELAMREDDI MUGDHA MOHANA SIVA PRIYA', phone: '9493539295', email: 'sivapriyaseelamreddy@gmail.com' },
  { roll: '25B25A4202', name: 'GUMMADIDALA UMA DEVI', phone: '8985913868', email: 'umadevigummadidala@gmail.com' },
];

async function updateContacts() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    let updatedCount = 0;
    let notFoundCount = 0;

    for (const record of studentContacts) {
      const cleanRoll = record.roll.trim().toUpperCase();
      const cleanEmail = record.email.trim().toLowerCase();
      const cleanPhone = record.phone.trim();
      const altRoll = record.altRoll ? record.altRoll.trim().toUpperCase() : null;

      // Find user by rollNumber or name or previous generated email
      const queryOr = [
        { rollNumber: cleanRoll },
        { email: `${cleanRoll.toLowerCase()}@kiet.edu` },
        { email: cleanEmail },
      ];
      if (altRoll) {
        queryOr.push({ rollNumber: altRoll });
        queryOr.push({ email: `${altRoll.toLowerCase()}@kiet.edu` });
      }

      let user = await User.findOne({ $or: queryOr });

      if (!user) {
        // Fallback by name match
        user = await User.findOne({ name: new RegExp('^' + record.name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') });
      }

      if (user) {
        // Check if cleanEmail is already taken by another doc
        const existingEmailUser = await User.findOne({ email: cleanEmail, _id: { $ne: user._id } });
        if (existingEmailUser) {
          console.warn(`Email collision for ${cleanEmail} (on user ${existingEmailUser.name}), changing other user email to temp...`);
          existingEmailUser.email = `temp_${Date.now()}_${existingEmailUser.email}`;
          await existingEmailUser.save();
        }

        user.email = cleanEmail;
        user.phone = cleanPhone;
        user.phoneNumber = cleanPhone;
        // Keep rollNumber consistent
        if (!user.rollNumber || user.rollNumber !== cleanRoll) {
          user.rollNumber = cleanRoll;
        }

        await user.save();
        updatedCount++;
        console.log(`[${updatedCount}/81] Updated ${user.name} (${cleanRoll}): phone=${cleanPhone}, email=${cleanEmail}`);
      } else {
        notFoundCount++;
        console.error(`[NOT FOUND] Could not find user with roll ${cleanRoll} (${record.name})`);
      }
    }

    console.log(`\nDone! Successfully updated ${updatedCount} students. (Not found: ${notFoundCount})`);
    process.exit(0);
  } catch (err) {
    console.error('Error updating student contacts:', err);
    process.exit(1);
  }
}

updateContacts();
