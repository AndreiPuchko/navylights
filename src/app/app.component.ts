import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CookieService } from 'ngx-cookie-service'
import { Observable } from 'rxjs';
import { FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { startWith, map } from 'rxjs/operators';

class Light {
  public color: string;
  public timeOn: number;

  constructor(color: string, timeOn: number) {
    this.color = color;
    this.timeOn = timeOn;
  }
}

class FlashCount {
  one: number;
  two: number;
  constructor(one: number, two: number) {
    this.one = one;
    this.two = two;
  }

}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  title = 'navylights';
  navytext: string = '';
  tmpText: string = "";
  showing: string = "";
  cookiesLights: string[] = [];
  defaultLights: string[] = ['VQ(3)5S',
    'VQ(6)LFL10S',
    'VQ(9)10S', 'VQ',
    'FL(2)5S',
    'VQ(2+1)',
    'ALWR4S'];
  filteredCookiesLights!: Observable<string[]>;
  navyTextControl = new FormControl();

  @ViewChild('navylight') navylight!: ElementRef<HTMLInputElement>;
  @ViewChild('errortext') errortext!: ElementRef<HTMLInputElement>;

  constructor(private cookieService: CookieService,
    private http: HttpClient,
  ) {
  }

  ngOnInit() {
    this.navyTextControl.setValue(this.defaultLights[0]);
    for (let i = 0; i < this.defaultLights.length; i++) {
      this.navytext = this.defaultLights[i];
      this.putCookie();
    }

    this.filteredCookiesLights = this.navyTextControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value))
    );
  }

  private _filter(value: string): string[] {
    const filterValue = value.toUpperCase();
    return this.cookiesLights.filter(cookiesLights => cookiesLights.includes(filterValue));
  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  onStop() {
    this.showing = "";
    this.navyTextControl.enable();
  }

  onClear() {
    this.showing = "";
    this.navyTextControl.setValue("");
  }

  showError(text: string) {
    this.errortext.nativeElement.innerHTML = text;
  }

  async blink(color: string, delay = 0) {
    this.navylight.nativeElement.style.background = color;
    console.log(color, delay);
    await this.delay(delay);
  }

  putLog(serie: Light[]) {
    var serieText = this.navytext+";";
    for (let x = 0; x < serie.length; x++) {
      serieText = serieText +
        serie[x].color.substr(0, 3) + ":" + Math.round(serie[x].timeOn) / 1000 + ",";
    }
    serieText = encodeURIComponent(serieText);
    console.log(serieText);
    this.http.get(window.location.href + "/log/?log=" +
      serieText,
      { responseType: 'blob' }).subscribe(data => { console.log("") })
  }

  async show(serie: Light[]) {
    this.putCookie();
    this.putLog(serie);
    this.showing = "Yes";
    this.navyTextControl.disable();

    // console.log(serie);

    while (this.showing === "Yes") {
      for (let x = 0; x < serie.length; x++) {
        // console.log(x,serie[x]);
        await this.blink(serie[x].color, serie[x].timeOn);
        if (this.showing != "Yes") break;
      }
      console.log("end of serie");
      if (this.showing != "Yes") break;
    }
    this.blink("black", 1);
  }

  getColor(): string[] {
    let colorMap = new Map();

    colorMap.set("Y", "yellow");
    colorMap.set("OR", "orange");
    colorMap.set("W", "white");
    colorMap.set("R", "red");
    colorMap.set("G", "green");
    colorMap.set("BU", "blue");
    colorMap.set("VI", "violet");

    let colorList = new Map();
    let color = new Array();
    this.cutLeadingSeparators();
    //make colors sequence
    let z = [...colorMap.keys()];
    for (let i = 0; i < z.length; i++) {
      var pos = 0;
      while (this.tmpText.indexOf(z[i], pos) >= 0) {
        colorList.set(this.tmpText.indexOf(z[i], pos), z[i]);
        pos = this.tmpText.indexOf(z[i], pos) + 1;
        // console.log(this.tmpText, colorSort);
      }
    }
    //remove colors
    for (let i = 0; i < z.length; i++) {
      this.tmpText = this.tmpText.replace(z[i], "");
    }
    //sort 
    var colorSort = [...colorList.entries()].sort();
    for (let i = 0; i < colorSort.length; i++) {
      // console.log("++",colorSort1[i],colorSort1[i][1],colorMap.get(colorSort1[i][1]));
      color.push(colorMap.get(colorSort[i][1]));
      if (colorSort[i][1] === "OR") i++;
    }

    if (color.length === 0) {
      color.push("white")
    }

    return color;
  }

  getPeriod() {
    let period = 0;
    this.cutLeadingSeparators();
    if (this.tmpText.endsWith("S")) {
      this.tmpText = this.tmpText.substr(0, this.tmpText.length - 1);
      var lo = "";
      while (/^\d+$/.test(this.tmpText[this.tmpText.length - 1])) {
        lo = this.tmpText[this.tmpText.length - 1] + lo;
        this.tmpText = this.tmpText.substr(0, this.tmpText.length - 1);
      }
      if (lo != "") {
        period = parseInt(lo) * 1000;
      }
    }
    return period
  }

  cutLeadingSeparators() {
    while ("+.".indexOf(this.tmpText[0]) >= 0) {
      this.tmpText = this.tmpText.substr(1);
    }
  }

  getFlashType() {
    let flashTypes = new Map();
    flashTypes.set("Q", 750);
    flashTypes.set("FL", 1200);
    flashTypes.set("LFL", 2000);
    flashTypes.set("L.FL", 2000);
    flashTypes.set("VQ", 600);
    flashTypes.set("V.Q", 600);
    flashTypes.set("UQ", 320);
    flashTypes.set("U.Q", 320);
    flashTypes.set("OC", 3000);
    flashTypes.set("ISO", 1000);
    flashTypes.set("AL", 1000);

    this.cutLeadingSeparators();
    for (let [key, value] of flashTypes) {
      if (this.tmpText.startsWith(key)) {
        this.tmpText = this.tmpText.substr(("" + key).length);
        // console.log(key,value,this.tmpText);
        var ec = value * 2;
        if (key === "OC") ec = value / 4;
        if (key === "ISO" || key === "AL") ec = value;
        return [value, ec]
      }
    }
    this.tmpText = this.tmpText.substr(1);
    return [0, 0];
  }

  putCookie() {
    let list: string[] = [];
    var listString = this.cookieService.get("navylights");
    try {
      list = JSON.parse(listString);
      this.cookiesLights = list;
    }
    catch {

    }

    if (this.navytext != "" && list.indexOf(this.navytext) < 0) {
      list.push(this.navytext);
      this.cookieService.set("navylights", JSON.stringify(list), 60, "/");
      this.cookiesLights = list;
    }
  }

  getFlashCount(): FlashCount {
    let flashCount = new FlashCount(1, 0);
    if (this.tmpText.startsWith("(")) {
      var countStr = this.tmpText.substr(1, this.tmpText.indexOf(")") - 1)
      if (countStr.indexOf(")") >= 0) {
        this.showError("It has ( but does not have )");
        return flashCount;
      }
      else if (countStr === "") {
        flashCount.one = 1;
      }
      else {
        flashCount.one = parseInt(countStr.split("+")[0]);
        if (countStr.indexOf("+") > -1) {
          flashCount.two = parseInt(countStr.split("+")[1]);
        }

        this.tmpText = this.tmpText.substr(this.tmpText.indexOf(")") + 1);
      }
    }
    return flashCount;
  }

  async onShow() {
    let serie: Light[] = [];
    let color = [];
    let flashValue = [];
    let flashCount = new FlashCount(0, 0);
    var totaFlashCount = 0;

    this.showError("");
    this.navytext = this.navyTextControl.value;
    this.tmpText = this.navytext.toUpperCase();

    var period = this.getPeriod();
    color = this.getColor();

    while (this.tmpText != "") {
      flashValue = this.getFlashType();
      var ltTime = flashValue[0];
      var ecTime = flashValue[1];
      flashCount = this.getFlashCount();

      if (flashCount.one + flashCount.two > 1) {
        totaFlashCount = flashCount.one + flashCount.two;
      }

      if (this.navytext.toUpperCase().startsWith("AL") && color.length > 1) {
        for (let z = 0; z < flashCount.one; z++) {
          for (let i = 0; i < color.length; i++) {
            serie.push(new Light(color[i], ltTime));
            serie.push(new Light("black", ltTime));
          }
        }
      }
      else {
        var delta = ((flashCount.one > 3) ? 200 * (1 - 1 / flashCount.one) : 0);
        var realEcTime = ecTime / flashCount.one;
        if (flashCount.one != 0 && ecTime != 0) {
          for (var i = 1; i <= flashCount.one; i++) {
            serie.push(new Light(color[0], ltTime / flashCount.one + delta));
            serie.push(new Light("black", realEcTime + delta * ecTime / ltTime));
          }
        }
        if (flashCount.two != 0 && ecTime != 0) {
          // console.log(serie)
          serie.push(new Light("black", realEcTime));
          if (ltTime > ecTime) { // for OC lights
            serie.push(new Light("black", 2 * realEcTime));
          }
          // console.log(serie)
          for (var i = 1; i <= flashCount.two; i++) {
            serie.push(new Light(color[0], ltTime / flashCount.one + delta));
            serie.push(new Light("black", realEcTime + delta * ecTime / ltTime));
          }
        }
        else {
          continue;
        };
      }
    }
    var totalLong = 0;
    serie.forEach(element => {
      totalLong = totalLong + element.timeOn;
    });
    // if totaFlashCount>0 - must be a period
    if (totaFlashCount > 0 && period == 0) {
      period = totalLong * 1.5;
    }

    if (period > 0 && period <= totalLong) { //serie too long - make it shorter
      serie.forEach(element => {
        element.timeOn = element.timeOn / (totalLong / (period / 2));
      });
      totalLong = totalLong / (totalLong / (period / 2));
    }

    if (period === 0 && serie.length > 2) { //no period = fake period
      period = totalLong;
    }
    if (period > totalLong) { // append ec for period time
      serie.push(new Light("black", period - totalLong));
    }
    // show serie
    if (serie.length > 0) {
      this.show(serie);
    }
  }
}
