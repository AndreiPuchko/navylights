import { Component,ViewChild,ElementRef } from '@angular/core';

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
    for (let i = 0; i < 6; i++) 
    {
      await this.blink("white",500);
      await this.blink("black",500);
    }
    await this.blink("white",2500);
    await this.blink("black");
  }

  async blink(color:string, delay=0){
    this.navylight.nativeElement.style.background=color;
    await  this.delay(delay);
  }

}
