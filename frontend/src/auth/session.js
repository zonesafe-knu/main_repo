// 로그인 세션(현재는 회사 코드/이름) 영속화 헬퍼.
// 저장 방식이 localStorage → 쿠키/토큰 등으로 바뀌더라도 호출부는 이 모듈만 의존하면 됩니다.

const COMPANY_CODE_KEY = 'companyCode';
const COMPANY_NAME_KEY = 'companyName';

export function saveSession({ companyCode, companyName }) {
  localStorage.setItem(COMPANY_CODE_KEY, companyCode);
  localStorage.setItem(COMPANY_NAME_KEY, companyName ?? '');
}

export function clearSession() {
  localStorage.removeItem(COMPANY_CODE_KEY);
  localStorage.removeItem(COMPANY_NAME_KEY);
}

export function getSession() {
  const companyCode = localStorage.getItem(COMPANY_CODE_KEY);
  if (!companyCode) return null;
  const companyName = localStorage.getItem(COMPANY_NAME_KEY) ?? '';
  return { companyCode, companyName };
}
