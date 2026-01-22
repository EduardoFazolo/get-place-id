import { getGPlaceId } from ".";

const main = async () => {
    const url = "https://www.google.com/maps?vet=10CAAQoqAOahcKEwiwyqOT0Z-SAxUAAAAAHQAAAAAQBg..i&pvq=Cg0vZy8xMXN3cnNobTh5IhEKC2lwcGFpIHJhbWVuEAIYAw&lqi=CgtpcHBhaSByYW1lbkidmp_87riAgAhaHRAAEAEYABgBIgtpcHBhaSByYW1lbioGCAIQABABkgETamFwYW5lc2VfcmVzdGF1cmFudA&fvr=1&cs=1&um=1&ie=UTF-8&fb=1&gl=br&sa=X&ftid=0x94dce398dd5cc993:0x3b7d4080271c9512";
    const placeId = await getGPlaceId(url, {
        apiKey: "AIzaSyBxKI5MVAfUooVCcDYobrtUn3e-gZ-rYH4"
    });
    console.log(placeId);
}

main();