/**
 * Promise에 타임아웃을 적용하는 유틸리티 함수
 * 지정된 시간 내에 완료되지 않으면 에러를 발생시킵니다.
 * @param promise 타임아웃을 적용할 Promise
 * @param ms 타임아웃 시간 (밀리초)
 * @param errorMessage 타임아웃 발생 시 에러 메시지
 * @returns 타임아웃이 적용된 Promise
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  let timer: NodeJS.Timeout;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(errorMessage));
    }, ms);
  });

  return Promise.race([
    promise
      .then((result) => {
        clearTimeout(timer);
        return result;
      })
      .catch((err) => {
        clearTimeout(timer);
        throw err;
      }),
    timeoutPromise,
  ]);
}
