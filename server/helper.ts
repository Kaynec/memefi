export function appendHeaders(token: string = "") {
  const myHeaders = new Headers();

  if (token) {
    myHeaders.append("authorization", `Bearer ${token}`);
  }
  myHeaders.append("content-type", "application/json");
  return myHeaders;
}
