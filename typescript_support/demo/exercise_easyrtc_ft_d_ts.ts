/**
 * Created by eric on 16/11/16.
 */
/// <reference path="../d.ts.files/client/easyrtc_ft.d.ts" />
function stub() {
   let fileSender:Easyrtc_ft_filesSender = easyrtc_ft.buildFileSender(
       "abcd",
        function(Easyrtc_ft_status):boolean{
            return true;
        },
       {}
   );
   easyrtc_ft.buildFileReceiver(
       function(otherGuy:string, filenamelist:string[], wasAccepted:(boolean)=>void):void {  wasAccepted(true);},
       function(otherGuy:string, blob:Blob, filename:string):void { easyrtc_ft.saveAs(blob, filename);},
       function(otherGuy:string, status:Easyrtc_ft_status):void {  }, {}
     );
    let blob:Blob;
    easyrtc_ft.saveAs(blob, "smith.bin");

}