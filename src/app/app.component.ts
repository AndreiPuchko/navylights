import { NumberSymbol } from '@angular/common';
import { Component,ViewChild,ElementRef } from '@angular/core';

class Light {
  public color: string;
  public timeOn: number;

  constructor(color:string,timeOn:number) {
    this.color=color;
    this.timeOn=timeOn;
    }
 }

class FlashCount {
  one: number;
  two: number;
  constructor(one:number,two:number) {
    this.one=one;
    this.two=two;
    }

}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  title = 'navylights';
  // navytext: string = 'alorbuvir';
  // navytext: string = 'VQ(6)LFL4S';
  navytext: string = 'VQ(9)10S';
  // navytext: string = 'VQ(2+1)';
  tmpText: string ="";
  showing: string  = "";
  @ViewChild('navylight') navylight!: ElementRef<HTMLInputElement>;
  @ViewChild('errortext') errortext!: ElementRef<HTMLInputElement>;

  delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }

  onStop(){
    this.showing="";
  }

  showError(text:string){
    this.errortext.nativeElement.innerHTML=text;
  }

  async blink(color:string, delay=0){
    this.navylight.nativeElement.style.background=color;
    console.log(color,delay);
    await this.delay(delay);
  }


  async show (serie:Light[]){
    this.showing="Yes";
    while (this.showing === "Yes") {
      for (let x=0; x<serie.length;x++){
        await this.blink(serie[x].color,serie[x].timeOn);
        if (this.showing != "Yes") break;
      }
      if (this.showing != "Yes") break;
    }
    this.blink("black",1);
  }

  getColor():string[]{
    let colorMap= new Map();
    
    colorMap.set("Y","yellow");
    colorMap.set("OR","orange");
    colorMap.set("W","white");
    colorMap.set("R","red");
    colorMap.set("G","green");
    colorMap.set("BU","blue");
    colorMap.set("VI","violet");
    
    let colorList= new Map();
    let color = new Array();  
    this.cutLeadingSeparators();
    //make colors sequence
    let z=[...colorMap.keys()];
    for (let i=0;i<z.length;i++){
      var pos=0;
      while (this.tmpText.indexOf(z[i],pos)>=0){
        colorList.set(this.tmpText.indexOf(z[i],pos),z[i]);
        pos=this.tmpText.indexOf(z[i],pos)+1;
        // console.log(this.tmpText, colorSort);
      }
    } 
    //remove colors
    for (let i=0;i<z.length;i++){
      this.tmpText=this.tmpText.replace(z[i],"");
    } 
    //sort 
    var colorSort=[...colorList.entries()].sort();
    for (let i=0;i<colorSort.length;i++){
      // console.log("++",colorSort1[i],colorSort1[i][1],colorMap.get(colorSort1[i][1]));
      color.push(colorMap.get(colorSort[i][1]));
      if (colorSort[i][1]==="OR") i++;
    }

    if (color.length===0){
      color.push("white")
    }
    
    return color;
  }
  
  getPeriod(){
    let period=0;
    this.cutLeadingSeparators();
    if (this.tmpText.endsWith("S")){
      this.tmpText=this.tmpText.substr(0,this.tmpText.length-1);
      var lo="";
      while (/^\d+$/.test(this.tmpText[this.tmpText.length-1])){
        lo=this.tmpText[this.tmpText.length-1]+lo;
        this.tmpText=this.tmpText.substr(0,this.tmpText.length-1);
      }
      if (lo!=""){
        period=parseInt(lo)*1000;
      }
    }
    return period
  }

  cutLeadingSeparators(){
    while ("+.".indexOf(this.tmpText[0])>=0) {
      this.tmpText=this.tmpText.substr(1);
      }
  }

  getFlashType(){
    let flashTypes= new Map();
    flashTypes.set("Q",750);
    flashTypes.set("FL",1200);
    flashTypes.set("LFL",2000);
    flashTypes.set("L.FL",2000);
    flashTypes.set("VQ",600);
    flashTypes.set("V.Q",600);
    flashTypes.set("UQ",320);
    flashTypes.set("U.Q",320);
    flashTypes.set("OC",3000);
    flashTypes.set("ISO",1000);
    flashTypes.set("AL",1000);

    this.cutLeadingSeparators();
    for (let [key, value] of flashTypes){
      if (this.tmpText.startsWith(key)){
        this.tmpText=this.tmpText.substr((""+key).length);
        console.log(key,value,this.tmpText);
        var ec=value*2;
        if (key==="OC") ec= value/4;
        if (key==="ISO" || key==="AL") ec= value;
        return [value,ec]
      }
    }
    this.tmpText=this.tmpText.substr(1);
    return [0,0];
  }

  getFlashCount():FlashCount{
    let flashCount=new FlashCount(1,0);
    if (this.tmpText.startsWith("(")) {
      var countStr=this.tmpText.substr(1,this.tmpText.indexOf(")")-1)
      if (countStr.indexOf(")")>=0 ) {
        this.showError("It has ( but does not have )");
        return flashCount;
      }
      else if (countStr === ""){
        flashCount.one=1;
      }
      else {
        flashCount.one=parseInt(countStr.split("+")[0]);
        flashCount.two=parseInt(countStr.split("+")[1]);
      }
    }
    return flashCount;
  }

  async onShow (){
    let serie : Light[]=[];
    let color=[];
    let flashValue=[];
    this.showError("");
    
    this.tmpText=this.navytext.toUpperCase();
    
    //Is period at the end?
    var period=this.getPeriod();
    //Color selection
    color=this.getColor();

    while (this.tmpText!="") {
      flashValue=this.getFlashType();
      var ltTime=flashValue[0];
      var ecTime=flashValue[1];
      var flashCount=this.getFlashCount();

      if (this.navytext.toUpperCase().startsWith("AL") && color.length>1){
        for (let i=0;i<color.length;i++){
          serie.push(new Light(color[i],ltTime));
        }
      }
      else
      {
          if (flashCount.one!=0 && ecTime!=0){
            for (var i=1 ; i<=flashCount.one;i++){
              console.log(i/color.length);
              serie.push(new Light(color[0],ltTime));
              serie.push(new Light("black",ecTime));
            }
          }
          if (flashCount.two!=0 && ecTime!=0){
            serie.push(new Light("black",ecTime));
            for (var i=1 ; i<=flashCount.two;i++){
              serie.push(new Light(color[0],ltTime));
              serie.push(new Light("black",ecTime));
            }
          }
          else {
            continue;
          };
      }
    }
    // if not AL - apply period
    if (!this.navytext.toUpperCase().startsWith("AL")){
      var totalLong=0;
      serie.forEach(element => {
        totalLong=totalLong+element.timeOn;
      });
      if ((period === 0 && serie.length>2) || 
            (period>0 && period-totalLong < 0) ){
        period=totalLong*1.5;
      }
      if (period-totalLong > 0 ){
        serie.push(new Light("black",period-totalLong));
      }
    }
    // show serie
    if (serie.length>0){
      this.show(serie);
    }
  }
}
