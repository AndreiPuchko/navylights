import { NumberSymbol } from '@angular/common';
import { Component,ViewChild,ElementRef } from '@angular/core';

const shortBlinkTime=1000;
const longBlinkTime=2000;
export class Light {
  public color: string;
  public timeOn: number;
  public timeOff: number;
  public repeatCount: number;

  constructor(color:string,timeOn:number,timeOff:number,repeat:number ) {
    this.color=color;
    this.timeOn=timeOn;
    this.timeOff=timeOff;
    this.repeatCount=repeat;
    }
 }

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  title = 'navylights';
  navytext: string = 'Q(6)LFL';
  @ViewChild('navylight') navylight!: ElementRef<HTMLInputElement>;

  delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }
  
  async onShow (){
    let serie : Light[]=[];
    serie.push(new Light("white",shortBlinkTime,shortBlinkTime,6));
    serie.push(new Light("white",longBlinkTime,0,1));
    // serie.push(new Light("yellow",shortBlinkTime,shortBlinkTime,2));
    for (let x=0; x<serie.length;x++){
      await this.show(serie[x]);
    }
    await this.blink("black");
  }

  async show (_light:Light){
    for (let i = 0; i < _light.repeatCount; i++)
    {
      await this.blink(_light.color,_light.timeOn);
      await this.blink("black",_light.timeOff);
    }
  }

  async blink(color:string, delay=0){
    this.navylight.nativeElement.style.background=color;
    await  this.delay(delay);
  }

}
