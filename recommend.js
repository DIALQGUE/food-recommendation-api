const { UserHistory } = require('./models/foods-model');

var ingredient = [
    "กระชาย",
    "กระเทียม",
    "กะทิ",
    "กะหล่ำปลี",
    "กะเพรา",
    "กุยช่าย",
    "กุ้ง",
    "ขนมจีน",
    "ขนมปัง",
    "ขาหมู",
    "ขึ้นฉ่าย",
    "ข่า",
    "ข้าว",
    "ข้าวต้ม",
    "งา",
    "ชีส",
    "ซอสมะเขือเทศ",
    "ซอสยากิโซบะ",
    "ซอสเกาหลี",
    "ซอสเทริยากิ",
    "ซีอิ๊วขาว",
    "ซีอิ๊วหวาน",
    "ซุป",
    "ตะไคร้",
    "ต้นหอม",
    "ต๊อก",
    "ถั่วงอก",
    "ถั่วฝักยาว",
    "ถั่วลิสง",
    "นม",
    "นมสด",
    "น้ำพริกเผา",
    "น้ำแดง",
    "เส้นบะหมี่",
    "ปลา",
    "ปลากระป๋อง",
    "ปลากราย",
    "ปลาซาบะ",
    "ปลาดุก",
    "ปลาดุกฟู",
    "ปลาทูน่า",
    "ปลาเนื้ออ่อน",
    "ปลาแซลม่อน",
    "ปู",
    "ผัก",
    "ผักกาด",
    "ผักกาดดอง",
    "ผักชี",
    "ผักบุ้ง",
    "ผักเครื่องเคียง",
    "พริก",
    "พริกขี้หนู",
    "พริกแกง",
    "พริกไทย",
    "พริกไทยป่น",
    "พะโล้",
    "พาสต้า",
    "มะม่วง",
    "มะเขือพวง",
    "มะเขือเทศ",
    "มะเขือเปราะ",
    "มิริน",
    "วาซาบิ",
    "วุ้นเส้น",
    "สาหร่าย",
    "หมึก",
    "หมู",
    "หมูชาชู",
    "หมูแดง",
    "หอมหัวใหญ่",
    "หอมแดง",
    "หอยแมลงภู่",
    "เกลือ",
    "เต้าหู้",
    "เต้าหู้เหลือง",
    "เต้าหู้ไข่",
    "เต้าเจี้ยว",
    "เนย",
    "เนื้อวัว",
    "เบค่อน",
    "เลือดไก่",
    "เส้นจันท์",
    "เส้นรามยอน",
    "เส้นราเมน",
    "เส้นโซบะ",
    "เห็ด",
    "เห็ดหอม",
    "แกงเขียวหวาน",
    "แป้งข้าวเจ้า",
    "แป้งข้าวโพด",
    "แป้งทอดกรอบ",
    "แพลนต์เบส",
    "โคชูจัง",
    "โชยุ",
    "โหระพา",
    "ใบมะกรูด",
    "ใบยอ",
    "ไก่",
    "ไข่",
    "ไข่ต้ม",
    "ไชโป๊ว"
];

var taste = [
    "จืด",
    "ฉุน",
    "ปรุงสุก",
    "มัน",
    "หวาน",
    "เค็ม",
    "เปรี้ยว",
    "เผ็ด"
];

var cuisine = [
    "กับข้าว",
    "จีน",
    "ญี่ปุ่น",
    "ตะวันตก",
    "ฟาสต์ฟู้ด",
    "อาหารจานเดียว",
    "อาหารตามสั่ง",
    "อาหารสำเร็จรูป",
    "อิตาลี",
    "เกาหลี",
    "แพลนต์เบส",
    "ไทย"
];

function detectCondition(parameter) {
    const condition = parameter.condition;
    if (ingredient.includes(condition))
        return { "type": "ingredient", "condition": condition };
    if (cuisine.includes(condition))
        return { "type": "cuisine", "condition": condition };
    if (taste.includes(condition))
        return { "type": "taste", "condition": condition };
    else
        return { "type": "", "condition": condition };
}

function randomRecommend(foods) {
    var random = Math.floor(Math.random() * foods.length);
    return foods[random].name;
}

function biasRandomRecommend(foods, userHistory) {
    pastFoods = userHistory.populate('food').map(record => record.food);
    biasFoods = foods.concat(pastFoods);
    var random = Math.floor(Math.random() * foods.length);
    return foods[random].name;
}

module.exports = {
    randomRecommend,
    biasRandomRecommend,
    detectCondition
};