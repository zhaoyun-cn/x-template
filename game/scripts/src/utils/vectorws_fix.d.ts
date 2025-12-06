/** @noSelfInFile */

/**
 * vectorws 类型修复
 * Dota 2 新增的 vectorws 类型会导致运行时序列化错误
 * 将其声明为 any 可以绕过问题
 */
declare type vectorws = any;

export {};