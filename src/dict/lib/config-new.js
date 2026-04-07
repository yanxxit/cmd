/**
 * 统一配置模块
 */
export default {
  // 首选引擎
  preferredEngine: process.env.PREFERRED_ENGINE || 'ds',
  
  // 详细模式
  verbose: process.env.VERBOSE === 'true',
  
  // 使用自旋动画
  spinner: true,
  
  // 输出颜色
  color: '#8c8c8c',
  
  // DS 词典数据路径
  dsDataPath: undefined, // 使用默认路径
  
  // 有道 API 配置
  youdaoApiKey: process.env.YOUDAO_API_KEY || '',
  youdaoSecretKey: process.env.YOUDAO_SECRET_KEY || '',
  
  // API 基础 URL
  getURL(word) {
    const isChinese = /^[\u4e00-\u9fa5]+$/.test(word);
    return isChinese 
      ? 'http://dict.youdao.com/search?q='
      : 'http://dict.youdao.com/search?q=';
  }
};
