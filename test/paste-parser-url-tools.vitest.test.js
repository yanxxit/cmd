import { describe, expect, it } from 'vitest';
import {
  buildEditorStats,
  buildUrlFromEditorState,
  createEditableParamList,
  parseParamsString,
  parseUrlInput,
  tryParseJSONValue,
} from '../public/paste-parser/js/services/url-tools.js';

describe('paste parser url tools', () => {
  it('parses url input into stats and params', () => {
    const result = parseUrlInput('example.com/search?q=%E6%B5%8B%E8%AF%95&page=2#tab=docs');

    expect(result.originalUrl).toBe('https://example.com/search?q=%E6%B5%8B%E8%AF%95&page=2#tab=docs');
    expect(result.queryParams).toEqual({ q: '测试', page: '2' });
    expect(result.hashParams).toEqual({ tab: 'docs' });
    expect(result.stats).toEqual({
      length: result.originalUrl.length,
      queryCount: 2,
      hashCount: 1,
      totalCount: 3,
    });
  });

  it('parses json-like param values when possible', () => {
    expect(parseParamsString('config={"dark":true}&page=1')).toEqual({
      config: { dark: true },
      page: '1',
    });
    expect(tryParseJSONValue('[1,2,3]')).toEqual([1, 2, 3]);
    expect(tryParseJSONValue('plain text')).toBe('plain text');
  });

  it('builds url from editor state with encoding and json normalization', () => {
    const fullUrl = buildUrlFromEditorState({
      baseUrl: 'https://example.com',
      pathname: '/view',
      queryParams: createEditableParamList([
        { key: 'config', value: '{"theme":"dark"}', encode: true, asJSON: true },
        { key: 'debug', value: 'true', encode: false, asJSON: false },
      ]),
      hashParams: createEditableParamList([
        { key: 'tab', value: 'preview', encode: false, asJSON: false },
      ]),
    });

    expect(fullUrl).toBe('https://example.com/view?config=%7B%22theme%22%3A%22dark%22%7D&debug=true#tab=preview');
    expect(buildEditorStats(fullUrl, [1, 2], [1])).toEqual({
      length: fullUrl.length,
      queryCount: 2,
      hashCount: 1,
    });
  });
});
