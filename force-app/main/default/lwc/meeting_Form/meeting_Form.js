import { LightningElement } from 'lwc';

export default class Meeting_Form extends LightningElement {

  renderedCallback() {
    console.log('Rendered callback executed..!!');

  }
}

function testBug() {
  return true;
  console.log("This line will never execute");
}