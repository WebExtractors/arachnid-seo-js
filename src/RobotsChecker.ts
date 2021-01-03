// @ts-ignore
import robotsParser from 'robots-parser';
import Puppeteer from 'puppeteer';
import { URL } from 'url';

export default class RobotsChecker {
  puppeteerParams: string[];
  robotsMap: Map<string, any>;
  constructor(puppeteerParams: string[]) {
    this.puppeteerParams = puppeteerParams;
    this.robotsMap = new Map();
  }

  private async getOrCreateForDomain(domain: URL): Promise<any> {
    if (!this.robotsMap.has(domain.host)) {
      const robotsFileUrl = `${domain.origin}/robots.txt`;
      const robotsContents = await this.getRobotsFileText(`${domain.origin}/robots.txt`);
      const robotsParserObject = this.createRobotsObject(robotsFileUrl, robotsContents);
      this.robotsMap.set(domain.host, robotsParserObject);
    }

    return this.robotsMap.get(domain.host);
  }

  private createRobotsObject(robotsUrl: string, robotsContents: string): any {
    return robotsParser(robotsUrl, robotsContents);
  }

  private async getRobotsFileText(robotsUrlTxt: string): Promise<string> {
    const browser = await Puppeteer.launch({ headless: true, args: this.puppeteerParams });
    const robotsPage = await browser.newPage();
    const robotsResponse = await robotsPage.goto(robotsUrlTxt, { waitUntil: 'domcontentloaded', timeout: 0 });
    let robotsTxt = '';
    if (robotsResponse!.status() >= 200 && robotsResponse!.status() <= 299) {
      robotsTxt = await robotsResponse!.text();
    }

    robotsPage.close();
    browser.close();

    return robotsTxt;
  }

  public async isAllowed(pageUrlTxt: string, userAgent: string): Promise<boolean> {
    const domainRobots = await this.getOrCreateForDomain(new URL(pageUrlTxt));
    return domainRobots.isAllowed(pageUrlTxt, userAgent);
  }
}
