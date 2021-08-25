import { NumberSymbol } from '@angular/common';
import { Component,ViewChild,ElementRef } from '@angular/core';

export class Light {
  public color: string;
  public timeOn: number;

  constructor(color:string,timeOn:number) {
    this.color=color;
    this.timeOn=timeOn;
    }
 }

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  title = 'navylights';
  // navytext: string = 'VQ(6)LFL4S';
  navytext: string = 'VQ(9)10S';
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

  getColor(){
    var colors={Y:"yellow",
                W:"white",
                R:"red",
                G:"green",
                BU:"blue",
                OR:"orange",
                VI:"violet",
    };
    var color:string="white";
    this.cutLeadingSeparators();
    Object.entries(colors).forEach(
      ([key, value]) => {
        if (this.tmpText.indexOf(key)>=0){
          color=value;
          this.tmpText=this.tmpText.replace(key,"");
        }
      }
    );
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
    this.cutLeadingSeparators();
    for (let [key, value] of flashTypes){
      if (this.tmpText.startsWith(key)){
        this.tmpText=this.tmpText.substr((""+key).length);
        console.log(key,value,this.tmpText);
        return [value,value*2]
      }
    }
    this.tmpText=this.tmpText.substr(1);
    return [0,0];
  }

  getFlashCount(){
    let flashCount=1;
    if (this.tmpText.startsWith("(")) {
      var countStr=this.tmpText.substr(1,this.tmpText.indexOf(")")-1)
      console.log(countStr);
      if (countStr.indexOf(")")>=0 || countStr === "") {
        this.showError("It has ( but does not have )");
        return 0;
      }
      flashCount=parseInt(countStr);
      this.tmpText=this.tmpText.substr(this.tmpText.indexOf(")")+1);
      console.log(flashCount,"**");
    }
    return flashCount;
  }

  async onShow (){

    let serie : Light[]=[];
    let ltTime=0;
    let ecTime=0;
    let period=0;
    let flashCount=1;
    let color="white";
    let flashValue=[];
    
    this.tmpText=this.navytext.toUpperCase();
    
    //Is period at the end?
    period=this.getPeriod();
    //Color selection
    color=this.getColor();
    while (this.tmpText!="") {
      console.log(this.tmpText,"<<<<<");
      ltTime=0;
      flashCount=0;

      flashValue=this.getFlashType();

      ltTime=flashValue[0];
      ecTime=flashValue[1];

      flashCount=this.getFlashCount();

      if (flashCount!=0 && ecTime!=0){
        for (var i=1 ; i<=flashCount;i++){
          serie.push(new Light(color,ltTime));
          serie.push(new Light("black",ecTime));
        }
      }
      else {
        continue;
      };
    }
    
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
    if (serie.length>0){
      this.show(serie);
    }
  }
}
