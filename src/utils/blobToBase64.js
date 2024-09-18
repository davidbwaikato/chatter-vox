
//callback - where we want to get result
const blobToBase64 = (blob, callback) => {
    console.log("**** blobToBase64(blob,callback)")
    console.log(blob)
    
    const reader = new FileReader();
    reader.onload = function () {
	const type = blob.type;
	const base64data = reader?.result?.split(",")[1];
	callback(blob,base64data,type);
    };
    reader.readAsDataURL(blob);
};

export { blobToBase64 };
