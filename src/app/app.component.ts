import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CookieService } from 'ngx-cookie-service'
import { Observable } from 'rxjs';
import { UntypedFormControl } from '@angular/forms';
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

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('seaview') seaview!:ElementRef<HTMLElement>;
  @ViewChild('navylight') navylight!: ElementRef<HTMLInputElement>;
  @ViewChild('errortext') errortext!: ElementRef<HTMLInputElement>;
  
  private ctx: any;
  rainInterval: any;

  title = 'Navylights';
  version = "0.0.11";
  navytext: string = '';
  tmpText: string = "";
  showing: string = "";
  cookiesLights: string[] = [];

  colorMap = new Map();
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
  navyTextControl = new UntypedFormControl();
  showRainControl = new UntypedFormControl();
  lightRadiusControl = new UntypedFormControl();
  rainDrops: any = [];

  constructor(private cookieService: CookieService,
    private http: HttpClient,
  ) {
    this.colorMap.set("Y", "yellow");
    this.colorMap.set("OR", "orange");
    this.colorMap.set("W", "white");
    this.colorMap.set("R", "red");
    this.colorMap.set("G", "green");
    this.colorMap.set("BU", "blue");
    this.colorMap.set("VI", "violet");
  }

  initRain() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    var qtRainDrops = w/4;
    this.rainDrops = [];
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
    this.initRain();

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
    console.log(this.rainDrops.length);
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
    // this.initRain();

    this.navyTextControl.setValue(this.defaultLights[0]);
    this.lightRadiusControl.setValue(10);
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
    if (delay > 0) {
      this.navylight.nativeElement.style.background = color;
      await this.delay(delay);
    }
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
    //light radius
    let ra = this.lightRadiusControl.value;
    this.navylight.nativeElement.style.borderRadius = ra + "px";
    this.navylight.nativeElement.style.width = 2 * ra + "px";
    this.navylight.nativeElement.style.height = 2 * ra + "px";

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
    this.blink("transparent", 1);
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

  pushNextLight(lastLightList: any[], listOfLights: any[]) {
    if (lastLightList.length != 0) {
      let light = new Map();
      light.set("lightType", lastLightList[0]);
      light.set("lightColors", this.getListOfColors(lastLightList));
      light.set("lightGroups", this.getListOfGroups(lastLightList));
      listOfLights.push(light);
      while (lastLightList.length != 0) { //clear list
        lastLightList.pop();
      }
    }
  }
  
  getListOfLights(tmpText: string): string[] {
    var reTypesOfLights = /(LFL|FL|F|OC|ISO|AL|Q|VQ|UQ|HQ)/;
    var listOfLights: any[] = [];
    var lastLightList: any[] = [];

    // console.log(tmpText.split(reTypesOfLights))

    tmpText.split(reTypesOfLights).forEach(element => {
      if (element != "") {
        if (element.match(reTypesOfLights)) {// This is light signature
          //save previous light - if it was one
          this.pushNextLight(lastLightList, listOfLights);
          //start to collect new light
          lastLightList.push(element);
        }
        else { // not light signature
          if (lastLightList.length > 0) {
            //ignore leading non-signature parts
            lastLightList.push(element);
          }
          // else {
          //   // lastLightList.push("Error");
          //   console.log(element);
          // }
        }
      }
    });
    if (lastLightList.length > 0) {
      this.pushNextLight(lastLightList, listOfLights);
    }
    return listOfLights;
  }

  getListOfColors(lightList: string[]): string[] {
    var reColors = /(W|R|G|Y|OR|BU)/;
    var listOfColors: string[] = [];

    if (lightList.length < 2) { //Single light? no color, no groups
      return listOfColors;
    }
    lightList[1].split(reColors).forEach(element => {
      if (element.match(reColors)) {
        listOfColors.push(element);
      }
    });
    return listOfColors;
  }

  getListOfGroups(lightList: string[]): string[] {
    var listOfGroups: string[] = [];
    var reGroups = /(\b\d+\b)/;
    if (lightList.length < 2) { //Single light? no color, no groups
      // return ['1'];
      return listOfGroups;
    }
    lightList[1].split(reGroups).forEach(element => {
      if (element.match(reGroups)) {
        listOfGroups.push(element);
      }
      // else {
      //   console.log("error group element "+element);
      // }
    });
    return listOfGroups
  }

  getLightSeries(tmpNavyText: string): Light[] {
    let flashTimes = new Map();
    flashTimes.set("VQ", 250);
    flashTimes.set("UQ", 120);
    flashTimes.set("Q", 500);
    flashTimes.set("FL", 1000);
    flashTimes.set("LFL", 2000);
    flashTimes.set("OC", 3000);
    flashTimes.set("ISO", 2000);
    flashTimes.set("AL", 2000);
    flashTimes.set("F", 1000);
    tmpNavyText = tmpNavyText.trim().toUpperCase()
    tmpNavyText = tmpNavyText.replace(/\s/, "").replace(/\./, "");

    let serie: Light[] = [];
    //Get period
    var period = 0.0;
    const rePeriod = /[0-9]*S$/;
    var isPeriod = tmpNavyText.match(rePeriod);
    if (isPeriod != null) {
      period = parseFloat(isPeriod[0].replace("S", ""));
      tmpNavyText = tmpNavyText.replace(rePeriod, "");
    }
    // Split to lights
    var listOfLights: any[] = this.getListOfLights(tmpNavyText);
    var eclipseColor = "transparent";
    //Build list of lights and eclipses
    var realLight = "";
    for (let i = 0; i < listOfLights.length; i++) {
      const currentFlashType = listOfLights[i].get("lightType");
      const currentGroups = listOfLights[i].get("lightGroups");
      var currentColors = listOfLights[i].get("lightColors");

      // make real light, w/o errors
      realLight = realLight + (realLight.length > 0 ? "+" : "") + currentFlashType;
      if (currentGroups.length > 0) {
        realLight = realLight + "(" + currentGroups.join("+") + ")";
      }
      if (currentColors.length > 0) {
        realLight = realLight + (realLight.length > 0 ? "." : "")
        if (currentFlashType === "AL")
          realLight = realLight + currentColors.join(".");
        else
          realLight = realLight + currentColors[0];
        realLight = realLight.replace("BU", "Bu").replace("OR", "Or")
      }
      // alert(currentColors.length)
      currentColors = (currentColors.length === 0 ? ["Y"] : currentColors);

      var interGroupMultiplier = 1;
      var lightColor = this.colorMap.get(currentColors[0]);
      var lightTime = flashTimes.get(currentFlashType);
      var eclipseTime = lightTime * 3;
      // tuning times
      if (currentFlashType === "F") eclipseTime = 0; // Fixed
      else if (currentFlashType === "ISO") eclipseTime = lightTime;
      else if (currentFlashType === "OC") { // swap light <> eclipse
        if (currentGroups.length === 1) { // Group
          lightTime = 2000;
          eclipseTime = 1000;
        }
        else if (currentGroups.length > 1) { // composite group
          lightTime = 1000;
          eclipseTime = 1000;
        }
        else {
          lightTime = 3000;
          eclipseTime = 1000;
        }
        [lightColor, eclipseColor] = [eclipseColor, lightColor];
        [eclipseTime, lightTime] = [lightTime, eclipseTime];
      }
      else if (currentFlashType === "FL") {
        if (currentGroups.length === 1) eclipseTime = lightTime * 2;
        if (currentGroups.length > 1) eclipseTime = lightTime;
      }
      else if (currentFlashType === "Q"
        || currentFlashType === "VQ"
        || currentFlashType === "UQ") {
        eclipseTime = lightTime;
        if (currentFlashType === "VQ") interGroupMultiplier = 2;
      }
      // create series
      if (currentFlashType === "AL") { // Nothing but ALTERNATING
        for (let colorIterCount = 0; colorIterCount < currentColors.length; colorIterCount++) {
          serie.push(new Light(this.colorMap.get(currentColors[colorIterCount]), lightTime));
        }
      }
      else { // anything else
        if (currentGroups.length === 0) {  // No groups - single light
          serie.push(new Light(lightColor, lightTime));
          serie.push(new Light(eclipseColor, eclipseTime));
          if (currentFlashType === "LFL" && i > 0) serie[serie.length - 1].timeOn = 1500;
        }
        else {  // Group or composite group
          for (let groupIterCount = 0; groupIterCount < currentGroups.length; groupIterCount++) {
            for (let groupRepeat = 0; groupRepeat < parseInt(currentGroups[groupIterCount]); groupRepeat++) {
              serie.push(new Light(lightColor, lightTime));
              serie.push(new Light(eclipseColor, eclipseTime));
            }
            // eclipse between parts of composite groups 
            serie[serie.length - 1].timeOn = serie[serie.length - 1].timeOn * 3 * interGroupMultiplier;
          }
          if (currentGroups.length > 1) { // composite group gap
            serie[serie.length - 1].timeOn = serie[serie.length - 1].timeOn * 3;
          }
        }
      }
      if (listOfLights.length > 1 && i < listOfLights.length - 1) {
        serie[serie.length - 1].timeOn = eclipseTime;
      }
    }
    if (listOfLights.length > 0) {
      // group is here - check period
      if (period != 0 || listOfLights.length > 1 || listOfLights[0].get("lightGroups").length > 0) {
        var totalLong = 0; // total duration
        serie.forEach(element => {
          totalLong = totalLong + element.timeOn;
        });
        if (totalLong < period * 1000) {
          serie[serie.length - 1].timeOn = serie[serie.length - 1].timeOn + (period * 1000 - totalLong);
        }
        else if (period!=0){
          period = Math.ceil(totalLong/1000)
        }
      }

      if (period!=0){
        realLight = realLight + period.toString() + "S"
      }

      if (serie.length > 0) {
        this.navyTextControl.setValue(realLight);
      }
    }
    // console.log(serie);
    return serie;
  }

  testLight(lightString: string, timesTestString: string, colorsTestString: string): boolean {
    const serie = this.getLightSeries(lightString);
    var timesString = serie.reduce((sum, cur) => sum + "," + cur.timeOn.toString(), "");
    var colorsString = serie.reduce((sum, cur) => sum + "," + cur.color.toString(), "");
    // console.log(timesString, colorsString);
    const rez = timesString === timesTestString && colorsString === colorsTestString
    if (rez === false)
      console.log(lightString, rez, serie, timesTestString)
    return rez
  }

  testAllLights():boolean {
    var testResuslts: boolean[] = [];
    testResuslts.push(this.testLight("F", ",1000,0", ",yellow,black"));
    testResuslts.push(this.testLight("OC", ",1000,3000", ",black,yellow"));
    testResuslts.push(this.testLight("OC(2)", ",1000,2000,1000,6000", ",black,yellow".repeat(2)));
    testResuslts.push(this.testLight("OC(2+1)",
      ",1000,1000,1000,3000,1000,9000",
      ",black,yellow".repeat(3)));
    testResuslts.push(this.testLight("ISO", ",2000,2000", ",yellow,black"));
    testResuslts.push(this.testLight("FL", ",1000,3000", ",yellow,black"));
    testResuslts.push(this.testLight("LFL", ",2000,6000", ",yellow,black"));
    testResuslts.push(this.testLight("LFL10S", ",2000,8000", ",yellow,black"));
    testResuslts.push(this.testLight("FL(2)", ",1000,2000,1000,6000", ",yellow,black,yellow,black"));
    testResuslts.push(this.testLight("FL(2+1)",
      ",1000,1000,1000,3000,1000,9000",
      ",yellow,black".repeat(3)));
    testResuslts.push(this.testLight("Q", ",500,500", ",yellow,black"));
    testResuslts.push(this.testLight("Q(3)", ",500,500,500,500,500,1500", ",yellow,black".repeat(3)));
    testResuslts.push(this.testLight("Q(3)10S", ",500,500,500,500,500,7500", ",yellow,black".repeat(3)));
    testResuslts.push(this.testLight("Q(9)",
      ",500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,1500",
      ",yellow,black".repeat(9)));
    testResuslts.push(this.testLight("Q(9)15S",
      ",500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,6500",
      ",yellow,black".repeat(9)));
    testResuslts.push(this.testLight("Q(6)+LFL",
      ",500,500,500,500,500,500,500,500,500,500,500,500,2000,1500",
      ",yellow,black".repeat(7)));
    testResuslts.push(this.testLight("Q(6)+LFL15S",
      ",500,500,500,500,500,500,500,500,500,500,500,500,2000,7000",
      ",yellow,black".repeat(7)));
    testResuslts.push(this.testLight("VQ", ",250,250", ",yellow,black"));
    testResuslts.push(this.testLight("VQ(3)",
      ",250,250,250,250,250,1500",
      ",yellow,black".repeat(3)));
    testResuslts.push(this.testLight("VQ(3)5S",
      ",250,250,250,250,250,3750",
      ",yellow,black".repeat(3)));
    testResuslts.push(this.testLight("VQ(9)",
      ",250,250,250,250,250,250,250,250,250,250,250,250,250,250,250,250,250,1500",
      ",yellow,black".repeat(9)));
    testResuslts.push(this.testLight("VQ(9)10S",
      ",250,250,250,250,250,250,250,250,250,250,250,250,250,250,250,250,250,5750",
      ",yellow,black".repeat(9)));
    testResuslts.push(this.testLight("VQ(6)+LFL",
      ",250,250,250,250,250,250,250,250,250,250,250,250,2000,1500",
      ",yellow,black".repeat(7)));
    testResuslts.push(this.testLight("VQ(6)+LFL10S",
      ",250,250,250,250,250,250,250,250,250,250,250,250,2000,5000",
      ",yellow,black".repeat(7)));
    testResuslts.push(this.testLight("UQ", ",120,120", ",yellow,black"));
    testResuslts.push(this.testLight("ALWR", ",2000,2000", ",white,red"));
    return testResuslts.indexOf(false) === -1
  }

  onShow() {
    // this.testAllLights()
    this.showError("");
    this.canvas.nativeElement.width = window.innerWidth;
    this.canvas.nativeElement.height = this.seaview.nativeElement.clientHeight -50;

    let serie: Light[] = this.getLightSeries(this.navyTextControl.value);

    if (serie.length > 1) {
      this.show(serie);
    }
    else {
      this.showError("Bad Light characteristic!");
    }
  }
}