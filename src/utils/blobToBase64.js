
//callback - where we want to get result
const blobToBase64 = (blob,abortController, callback) => {
    console.log("blobToBase64()", blob);
    
    const reader = new FileReader();
    reader.onload = function () {
	const type = blob.type;
	const base64data = reader?.result?.split(",")[1];
	callback(blob,base64data,type,abortController);
    };
    reader.readAsDataURL(blob);
};

export { blobToBase64 };
