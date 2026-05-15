// 国籍 + 中英文姓名 + 简易地址 数据与生成
import { randInt, pick } from './random.js';

/** 国籍数据：emoji 旗、英文代号、中文显示、地址国家词 */
export const COUNTRIES = [
  { code: 'CN', flag: '🇨🇳', label: '中国' },
  { code: 'US', flag: '🇺🇸', label: '美国' },
  { code: 'GB', flag: '🇬🇧', label: '英国' },
  { code: 'JP', flag: '🇯🇵', label: '日本' },
  { code: 'KR', flag: '🇰🇷', label: '韩国' },
  { code: 'SG', flag: '🇸🇬', label: '新加坡' },
  { code: 'MY', flag: '🇲🇾', label: '马来西亚' },
  { code: 'AU', flag: '🇦🇺', label: '澳大利亚' },
  { code: 'CA', flag: '🇨🇦', label: '加拿大' },
  { code: 'DE', flag: '🇩🇪', label: '德国' },
  { code: 'FR', flag: '🇫🇷', label: '法国' },
];

const CN_SURNAMES = ['王','李','张','刘','陈','杨','黄','赵','周','吴','徐','孙','马','朱','胡','郭','林','何','高','梁'];
const CN_MALE_GIVEN = ['伟','强','磊','军','勇','杰','明','浩','宇','飞','建','鹏','涛','峰','龙','刚','超','辉','鑫','博'];
const CN_FEMALE_GIVEN = ['娜','芳','敏','静','丽','艳','玲','萍','婷','雪','梅','琳','红','倩','瑶','薇','欣','莹','洁','茹'];

const EN_FIRST_M = ['James','John','Robert','Michael','William','David','Richard','Joseph','Thomas','Charles','Daniel','Matthew','Anthony','Donald','Mark','Paul','Steven','Andrew','Kenneth','Joshua'];
const EN_FIRST_F = ['Mary','Patricia','Jennifer','Linda','Elizabeth','Barbara','Susan','Jessica','Sarah','Karen','Nancy','Lisa','Margaret','Betty','Sandra','Ashley','Kimberly','Emily','Donna','Michelle'];
const EN_LAST = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin'];

const JP_LAST = ['佐藤','鈴木','高橋','田中','伊藤','渡辺','山本','中村','小林','加藤'];
const JP_FIRST_M = ['翔太','大輝','健太','拓海','蓮','陽斗','颯','悠真','蒼','陸'];
const JP_FIRST_F = ['結愛','陽菜','凜','紬','澪','美咲','心結','莉央','花','楓'];

const KR_LAST = ['김','이','박','최','정','강','조','윤','장','임'];
const KR_FIRST_M = ['민준','서준','예준','도윤','시우','주원','하준','지호','준서','준우'];
const KR_FIRST_F = ['서연','지우','서윤','지유','하은','하윤','민서','지민','수아','지아'];

const CN_PROVINCES = ['北京市','上海市','广东省广州市','广东省深圳市','浙江省杭州市','江苏省南京市','四川省成都市','湖北省武汉市','陕西省西安市','重庆市'];
const CN_STREETS = ['朝阳路','人民大道','中山路','解放路','建国路','和平街','光明路','长安街','滨江大道','文明大道'];

const US_STATES = ['CA','NY','TX','FL','WA','IL','MA','CO','GA','PA'];
const US_CITIES = ['San Francisco','New York','Los Angeles','Chicago','Seattle','Boston','Denver','Atlanta','Austin','Miami'];
const US_STREETS = ['Main St','2nd Ave','Oak St','Pine St','Maple Ave','Cedar Ln','Elm St','Park Ave','Lake Dr','Hill Rd'];

const UK_CITIES = ['London','Manchester','Birmingham','Liverpool','Leeds','Bristol','Sheffield','Cardiff','Edinburgh','Glasgow'];
const UK_STREETS = ['High Street','King Street','Queen Street','Church Lane','Mill Road','Victoria Road','Station Road','Park Road','Albert Street','Royal Avenue'];

const JP_CITIES = ['東京都','大阪府','京都府','北海道','神奈川県','愛知県','福岡県','兵庫県','千葉県','埼玉県'];
const JP_STREETS = ['桜町','梅ヶ丘','本町','緑町','旭町','大和町','栄町','中央町','銀座','新宿'];

const KR_CITIES = ['서울특별시','부산광역시','인천광역시','대구광역시','대전광역시','광주광역시','울산광역시','수원시','성남시','고양시'];
const KR_STREETS = ['강남대로','테헤란로','을지로','종로','광화문로','명동길','홍대로','신촌로','잠실로','반포로'];

/**
 * 根据国籍 + 性别生成姓名
 * @param {string} country 国籍代号
 * @param {'male'|'female'} gender
 * @returns {string}
 */
export function genName(country, gender) {
  const isMale = gender === 'male';
  switch (country) {
    case 'CN':
      return pick(CN_SURNAMES) + (Math.random() < 0.5
        ? pick(isMale ? CN_MALE_GIVEN : CN_FEMALE_GIVEN)
        : pick(isMale ? CN_MALE_GIVEN : CN_FEMALE_GIVEN) +
          pick(isMale ? CN_MALE_GIVEN : CN_FEMALE_GIVEN));
    case 'JP':
      return pick(JP_LAST) + ' ' + pick(isMale ? JP_FIRST_M : JP_FIRST_F);
    case 'KR':
      return pick(KR_LAST) + pick(isMale ? KR_FIRST_M : KR_FIRST_F);
    default:
      return pick(isMale ? EN_FIRST_M : EN_FIRST_F) + ' ' + pick(EN_LAST);
  }
}

/**
 * 根据国籍生成地址（仅做演示用，非真实地址）
 */
export function genAddress(country) {
  switch (country) {
    case 'CN': {
      const city = pick(CN_PROVINCES);
      const street = pick(CN_STREETS);
      return `${city} ${street}${randInt(1, 999)}号 ${randInt(1, 30)}单元${randInt(101, 2304)}室`;
    }
    case 'JP': {
      return `${pick(JP_CITIES)} ${pick(JP_STREETS)} ${randInt(1, 9)}-${randInt(1, 30)}-${randInt(1, 30)}`;
    }
    case 'KR': {
      return `${pick(KR_CITIES)} ${pick(KR_STREETS)} ${randInt(1, 999)}, ${randInt(101, 2304)}호`;
    }
    case 'GB': {
      return `${randInt(1, 200)} ${pick(UK_STREETS)}, ${pick(UK_CITIES)}, UK`;
    }
    case 'US':
    default: {
      return `${randInt(1, 9999)} ${pick(US_STREETS)}, ${pick(US_CITIES)}, ${pick(US_STATES)} ${randInt(10000, 99999)}, USA`;
    }
  }
}
