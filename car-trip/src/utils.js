/**
 * Downloads a binary file from provided url as the provided responseType
 * @param {*} url URL to download binary from
 * @param {*} responseType ['arraybuffer', 'blob', 'json', 'text']
 * @param {*} timeout How many milliseconds wait until timeout on request
 */
const downloadBin = (url, responseType = "arraybuffer", timeout = 10000) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    /* NOTE: you want to do this, but you can't.. its forbidden
       https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_header_name
       xhr.setRequestHeaders('accept-encoding','gzip')
    */
    xhr.open("GET", url, true)

    xhr.async = true
    xhr.timeout = timeout
    // xhr.withCredentials = true;
    xhr.responseType = responseType

    xhr.onload = () => {
      if (xhr.response) {
        resolve(xhr.response)
      } else {
        reject(new Error(`No buffer`))
      }
    }
    xhr.onerror = () => reject(new Error("error loading frame asset"))
    xhr.ontimeout = () => reject(new Error("Connection timeout"))
    xhr.send(null)
  })
module.exports.downloadBin = downloadBin
