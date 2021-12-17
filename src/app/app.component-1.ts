import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CookieService } from 'ngx-cookie-service'
import { Observable } from 'rxjs';
import { FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { startWith, map } from 'rxjs/operators';
import { FindValueSubscriber } from 'rxjs/internal/operators/find';
// import * as jison from "jison";

class Light {
  public color: string;
  public timeOn: number;

  constructor(color: string, timeOn: number) {
    this.color = color;
    this.timeOn = timeOn;
  }
}

class FlashCount {
  list: Array<number> = [];

  sumFlash(): number {
    return this.list.reduce((sum, cur) => sum + cur, 0);
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  private ctx: any;
  rainInterval: any;

  title = 'navylights';
  navytext: string = '';
  tmpText: string = "";
  showing: string = "";
  cookiesLights: string[] = [];
  defaultLights: string[] = [
    'VQ(6)LFL10S',
    'VQ(9)10S',
    'VQ(3)5S',
    'VQ',
    'ALWRW4S',
    'Iso W 6s ',
    'Fl (1+4+3)W 45s',
    'Fl(1+2)R',
    'FL(2)5S',
    'VQ(2+1)',
    'ALWR4S'];
  filteredCookiesLights!: Observable<string[]>;
  navyTextControl = new FormControl();
  showRainControl = new FormControl();
  lightRadiusControl = new FormControl();
  rainDrops: any = [];
  @ViewChild('navylight') navylight!: ElementRef<HTMLInputElement>;
  @ViewChild('errortext') errortext!: ElementRef<HTMLInputElement>;

  constructor(private cookieService: CookieService,
    private http: HttpClient,
  ) {
  }

  initRain() {
    var qtRainDrops = 300;
    var w = window.innerWidth;
    var h = window.innerHeight;

    for (var a = 0; a < qtRainDrops; a++) {
      this.rainDrops[a] = {
        x: Math.random() * w,
        y: Math.random() * h,
        l: Math.random() * 3,
        xs: -4 + Math.random() * 4 + 2,
        ys: Math.random() * 10 + 10
      };
    }
  }

  startRain() {
    if (this.showRainControl.value === true) {
      this.rainInterval = setInterval(() => {
        this.drawRain()
      },
        30);
    }
  }

  stopRain() {
    clearInterval(this.rainInterval);
  }

  onRainCheck() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    this.ctx.clearRect(0, 0, w, h);
    // if (this.showRainControl.value === true && this.showing === "Yes"){
    //   this.startRain();
    // }
  }

  drawRain() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    this.ctx.clearRect(0, 0, w, h);
    for (var c = 0; c < this.rainDrops.length; c++) {
      var p = this.rainDrops[c];

      // this.ctx.fillStyle = "white"
      // this.ctx.fillRect(p.x, p.y, 5, 5)
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = "white";
      this.ctx.beginPath();
      this.ctx.moveTo(p.x, p.y);
      this.ctx.lineTo(p.x + p.l * p.xs, p.y + p.l * p.ys);
      this.ctx.fill();
      this.ctx.stroke();
    }
    // Move drops
    for (var b = 0; b < this.rainDrops.length; b++) {
      var p = this.rainDrops[b];
      p.x += p.xs;
      p.y += p.ys;
      if (p.x > w || p.y > h) {
        p.x = Math.random() * w;
        p.y = -20;
      }
    }
  }

  ngOnInit() {

    this.ctx = this.canvas.nativeElement.getContext("2d");
    this.canvas.nativeElement.width = window.innerWidth;
    this.canvas.nativeElement.height = window.innerHeight;
    this.initRain();

    this.navyTextControl.setValue(this.defaultLights[0]);
    this.navyTextControl.setValue("VQ(6)+LFl. 10s");
    this.lightRadiusControl.setValue(25);
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

  onStop() {
    this.stopRain()
    this.showing = "";
    this.navyTextControl.enable();
    this.lightRadiusControl.enable();
    this.showRainControl.enable();
  }

  onClear() {
    this.showing = "";
    this.navyTextControl.setValue("");
    this.showError("");
  }

  showError(text: string) {
    this.errortext.nativeElement.innerHTML = text;
  }

  async blink(color: string, delay = 0) {
    this.navylight.nativeElement.style.background = color;
    await this.delay(delay);
  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  putLog(serie: Light[]) {
    var serieText = "[" + this.navytext + "]";
    for (let x = 0; x < serie.length; x++) {
      serieText = serieText +
        serie[x].color.substr(0, 3).replace("bla", "ec") + ":" + Math.round(serie[x].timeOn) / 1000 + ",";
    }
    // console.log(serieText);
    serieText = encodeURIComponent(serieText);
    this.http.get(window.location.href + "/log/?log=" +
      serieText,
      { responseType: 'blob' }).subscribe(data => { console.log("") })
  }
  // show lights
  async show(serie: Light[]) {
    this.putCookie();
    this.putLog(serie);
    this.showing = "Yes";
    this.navyTextControl.disable();
    this.lightRadiusControl.disable();
    this.showRainControl.disable();
    // console.log(serie);
    this.startRain();
    while (this.showing === "Yes") {
      for (let x = 0; x < serie.length; x++) {
        console.log(x, serie[x]);
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
      }
    }
    //remove colors
    this.tmpText = this.tmpText.replace(/Y/gi, "");
    this.tmpText = this.tmpText.replace(/OR/gi, "");
    this.tmpText = this.tmpText.replace(/W/gi, "");
    this.tmpText = this.tmpText.replace(/R/gi, "");
    this.tmpText = this.tmpText.replace(/G/gi, "");
    this.tmpText = this.tmpText.replace(/BU/gi, "");
    this.tmpText = this.tmpText.replace(/VI/gi, "");
    //sort 
    var colorSort = [...colorList.entries()].sort();
    for (let i = 0; i < colorSort.length; i++) {
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
      while (/^\d+$/.test(this.tmpText[this.tmpText.length - 1]) ||
        this.tmpText[this.tmpText.length - 1] === '.') {
        if (this.tmpText[this.tmpText.length - 1] === ".") {
          lo = this.tmpText[this.tmpText.length - 1] + lo;
        }
        this.tmpText = this.tmpText.substr(0, this.tmpText.length - 1);
      }
      if (lo != "") {
        period = parseFloat(lo) * 1000;
      }
    }
    return period
  }

  cutLeadingSeparators() {
    while ("+[.\+] ".indexOf(this.tmpText[0]) >= 0) {
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
    flashTypes.set("F", 1234);
    this.cutLeadingSeparators();
    // alert("-"+this.tmpText)
    for (let [key, value] of flashTypes) {
      // console.log(key)
      if (this.tmpText.startsWith(key)) {
        this.tmpText = this.tmpText.substr(("" + key).length);
        // alert("!"+this.tmpText)
        // console.log("found key"+key+"-"+this.tmpText)
        var ec = value * 2;
        if (key === "OC") ec = value / 4;
        if (key === "ISO" || key === "AL") ec = value;
        return [value, ec]
      }
    }
    // console.log("==" + this.tmpText)
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
    let flashCount = new FlashCount();
    if (this.tmpText.startsWith("(")) {
      var countStr = this.tmpText.substr(1, this.tmpText.indexOf(")") - 1)
      if (countStr.indexOf(")") >= 0) {
        this.showError("It has ( but does not have )");
        return flashCount;
      }
      else if (countStr === "") {
        flashCount.list.push(1);
      }
      else {
        for (var x = 0; x < countStr.split("+").length; x++) {
          flashCount.list.push(parseInt(countStr.split("+")[x]));
        }
        this.tmpText = this.tmpText.substr(this.tmpText.indexOf(")") + 1);
      }
    }
    else {
      flashCount.list.push(1);
    }
    return flashCount;
  }
  // Show button pressed

  pushNextLight(lastLightList: any[], listOfLights: any[]) {
    if (lastLightList.length != 0) {
      let light = new Map();
      light.set("lightType",lastLightList[0]);
      light.set("lightColors", this.getListOfColors(lastLightList));
      light.set("lightGroups", this.getListOfGroups(lastLightList));
      console.log(light);
      listOfLights.push([lastLightList[0],
      this.getListOfColors(lastLightList),
      this.getListOfGroups(lastLightList)]);
      while (lastLightList.length != 0) { //clear list
        lastLightList.pop();
      }
    }
  }


  getListOfLights(tmpText: string): string[] {
    var reTypesOfLights = /(LFL|FL|OC|ISO|Al|VQ|UQ|HQ)/;
    var listOfLights: any[] = [];
    var lastLightList: any[] = [];

    function pushNextLight() {
      if (lastLightList.length != 0) {
        listOfLights.push([lastLightList[0]]);
        lastLightList = [];
      }
    }

    tmpText.split(reTypesOfLights).forEach(element => {
      if (element != "") {
        if (element.match(reTypesOfLights)) {
          this.pushNextLight(lastLightList, listOfLights);
        }
        lastLightList.push(element);
      }
    });
    this.pushNextLight(lastLightList, listOfLights);
    return listOfLights;
  }

  getListOfColors(lightString: string[]): string[] {
    var reColors = /(W|R|G|Y|OR|BU)/;
    var listOfColors: string[] = [];
    if (lightString.length < 2) { //Single light? no color, no groups
      return listOfColors;
    }
    lightString[1].split(reColors).forEach(element => {
      if (element.match(reColors)) {
        listOfColors.push(element);
      }
    });
    return listOfColors;
  }

  getListOfGroups(lightString: string[]): string[] {
    var listOfGroups: string[] = [];
    var reGroups = /(\b\d+\b)/;
    if (lightString.length < 2) { //Single light? no color, no groups
      return listOfGroups;
    }
    lightString[1].split(reGroups).forEach(element => {
      if (element.match(reGroups)) {
        listOfGroups.push(element);
      }
    });
    return listOfGroups
  }

  newOnShow() {
    this.navytext = this.navyTextControl.value.trim().toUpperCase();
    var tmpNavyText = this.navytext.replace(/\s/, "").replace(/\./, "");
    //Get period
    var period = "";
    var isPeriod = tmpNavyText.match(/[0-9]*S$/);
    if (isPeriod != null) {
      period = isPeriod[0];
      tmpNavyText = tmpNavyText.replace(/[0-9]*S$/, "");
    }
    // Split to lights
    var listOfLights: any[] = this.getListOfLights(tmpNavyText);
    //Build tree of lights
    listOfLights.forEach(el => {
      // console.log(el, this.getListOfColors(el), this.getListOfGroups(el));
      console.log(el);
    });
    console.log(period);
  }


  onShow() {
    this.newOnShow();
    return;
    let ra = this.lightRadiusControl.value;
    this.navylight.nativeElement.style.borderRadius = ra + "px";
    this.navylight.nativeElement.style.width = 2 * ra + "px";
    this.navylight.nativeElement.style.height = 2 * ra + "px";


    let serie: Light[] = [];
    let color: string[] = [];
    let flashValue = [];
    let flashCount = new FlashCount();

    this.navytext = this.navyTextControl.value.trim().toUpperCase();
    this.tmpText = this.navytext.replace(/\s/g, "").replace(/\./g, "");
    this.showError("");

    var period = this.getPeriod();
    //parse until empty string
    while (this.tmpText != "") {
      //for every non first section - duplicate period of black
      if (serie.length > 0) {
        serie.push(serie[serie.length - 1])
      }
      // console.log(this.tmpText);
      flashValue = this.getFlashType();

      if (flashValue[0] === 0 && flashValue[0] === 0) {
        this.showError("Bad Light characteristic" + this.tmpText);
        return
      }
      // console.log(flashValue);

      var ltTime = flashValue[0];
      var ecTime = flashValue[1];
      if (ltTime === 0) {
        continue
      }
      flashCount = this.getFlashCount();
      // console.log(flashCount);
      if (color.length === 0) {
        color = this.getColor();
      }

      // alert(flashCount.list.length);
      // AL lights
      if (this.navytext.startsWith("AL") && color.length > 1) {
        for (let z = 0; z < flashCount.list[0]; z++) {
          for (let i = 0; i < color.length; i++) {
            serie.push(new Light(color[i], ltTime));
            serie.push(new Light("black", ltTime));
          }
        }
      }
      //fixed light
      else if (ltTime === 1234) {
        serie.push(new Light(color[0], ltTime));
      }
      //Regular lights
      else {
        var realEcTime = ecTime;
        var realLtTime = ltTime; flashCount.sumFlash();
        for (var z = 0; z < flashCount.list.length; z++) {
          if (z > 0) { // works for (2+1) etc
            serie.push(new Light("black", realEcTime * 2));
            if (ltTime > ecTime) { // for OC lights
              serie.push(new Light("black", 2 * realEcTime));
            }
          }
          for (var i = 1; i <= flashCount.list[z]; i++) {
            serie.push(new Light(color[0], realLtTime));
            serie.push(new Light("black", realEcTime / 3));
          }
        }
      }
    }
    // console.log(serie)
    if (this.navytext.startsWith("ISO") && period != 0 && serie.length === 2) {
      serie[0].timeOn = serie[1].timeOn = period / 2;
    }
    else {//count total long of signals
      var totalLong = 0;
      serie.forEach(element => {
        totalLong = totalLong + element.timeOn;
      });
      if (period != 0 && period < totalLong) {
        // alert("Given period is less than total leght of signal");
        this.showError("The given period is less than the total length of signals");
        return
      }

      // if flashCount.sumFlash()>0 - must be a period
      if (flashCount.sumFlash() > 1 && period == 0) {
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
    }
    // show serie
    if (serie.length > 0) {
      this.show(serie);
    }
  }
}