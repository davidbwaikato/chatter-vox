
//callback - where we want to get result
const blobToBase64 = (blob, callback) => {
    const reader = new FileReader();
    reader.onload = function () {
	const type = blob.type;
	const base64data = reader?.result?.split(",")[1];
	callback(base64data,type);
    };
    reader.readAsDataURL(blob);
};

export { blobToBase64 };
