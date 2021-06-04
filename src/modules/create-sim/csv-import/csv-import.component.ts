import { Component, Input, OnInit } from '@angular/core';
import { IndexedCommandQueueEntry } from '@models/commandQueue.model';
import { Alert, AlertService } from "@c8y/ngx-components";
import { DefaultConfig } from '@models/inputFields.const';
import { InstructionCategory, SeriesInstruction, SmartInstruction, SmartRestInstruction, SeriesCSVInstruction } from '@models/instruction.model';
import { InstructionService } from '@services/Instruction.service';
import { SimulatorSettingsService } from '@services/simulatorSettings.service';
import { SimulatorsServiceService } from "@services/simulatorsService.service";
import { ManagedObjectUpdateService } from "@services/ManagedObjectUpdate.service";
import { IManagedObject } from "@c8y/client";

@Component({
  selector: 'app-csv-import',
  templateUrl: './csv-import.component.html',
  styleUrls: ['./csv-import.component.scss']
})
export class CsvImportComponent implements OnInit {
  instructionCategories: InstructionCategory[] = DefaultConfig;
  smartRestCategory: InstructionCategory = InstructionCategory.SmartRest;

  
  choosenInstructionCategory: InstructionCategory;
  smartRestSelectedConfig;
  step = 1;
  file:any;
  delimiter:string = ';';
  data: string[][] = [];
  dataPoints: number;
  dataProperties: string[] = [];
  @Input() smartRestConfig;
  @Input() indexedCommandQueue: IndexedCommandQueueEntry[];
  @Input() importCSVView: boolean;
  @Input() allInstructionsSeries;
  
  constructor(
    private simSettingsService: SimulatorSettingsService,
    private instructionService: InstructionService,
    private updateService: ManagedObjectUpdateService,
    private alertService: AlertService,
    private simulatorervice: SimulatorsServiceService
    ) { }

  ngOnInit() {
    console.error(this.smartRestConfig, this.smartRestCategory);
  }
  categoryChange(event) {
    console.error(event, this.smartRestSelectedConfig);
  }
  deepCopy(obj){
    return JSON.parse(JSON.stringify(obj));
  }
  autoMapping() {
    let succeededMappings = 0;
    let checkedDataProperties = this.deepCopy(this.dataProperties);
    let filteredCustomValues = this.smartRestSelectedConfig.smartRestFields.customValues.filter(a => !a.value);
    for (let smartRestField of filteredCustomValues){
      for (let i = 0; i < checkedDataProperties.length; i++){
        let csvProperty = checkedDataProperties[i];
        if (smartRestField.path.includes(csvProperty)) {
          smartRestField['csvProperty'] = csvProperty;
          smartRestField['csvValues'] = this.data[i];
          succeededMappings++;
          checkedDataProperties.splice(i,1);
          this.data.splice(i,1);
          break;
        }
      }
    }
    
    console.log(`${succeededMappings} of ${filteredCustomValues.length} successfully mapped`);
    console.log(this.smartRestSelectedConfig);
  }
  
  mapDataToSmartRest(smartRestField, csvProperty:string, i:number) {
    console.info(csvProperty, smartRestField, i , this.data);
    smartRestField['csvProperty'] = csvProperty;
    smartRestField['csvValues'] = this.data[i];
    console.log(this.smartRestSelectedConfig);
  }

  startImport() {
    let smartRestInstructions: SmartRestInstruction[] = [];
    console.info(this.smartRestSelectedConfig.smartRestFields.customValues);
    const assignedIndex: string = this.allInstructionsSeries.length.toString();


    for (let i = 0; i < this.dataPoints; i++){
      let smartRestInstruction = {
        type: InstructionCategory.SmartRest
      } as SmartInstruction;
      for (let smartRestField of this.smartRestSelectedConfig.smartRestFields.customValues) {
        if(smartRestField.value !== null){continue;}

        smartRestInstruction[smartRestField['path']] = '';

        if (smartRestField['csvValues']){
          smartRestInstruction[smartRestField['path']] = smartRestField['csvValues'][i];
        }
      }
      smartRestInstructions.push(smartRestInstruction as SmartRestInstruction);

      console.error(smartRestInstruction);
      const smartRestCommandQueueEntry = this.instructionService.smartRestInstructionToCommand(smartRestInstruction, this.smartRestSelectedConfig);
      console.error(smartRestInstruction, smartRestCommandQueueEntry);

      let indexedCommandQueueEntry = { ...smartRestCommandQueueEntry, index: assignedIndex };

      
      this.indexedCommandQueue.push(indexedCommandQueueEntry);
      //this.indexedCommandQueue.push(indexedCommandQueueEntry);
      this.simSettingsService.updateCommandQueueAndIndicesFromIndexedCommandQueue(this.indexedCommandQueue);
      this.updateCommandQueueInManagedObject(this.updateService.mo, 'SmartRest');
      this.importCSVView = false;
    }


    this.simSettingsService.pushToInstructionsArray({
      index: assignedIndex,
    //  type: InstructionCategory.CSVImport
    } as SeriesCSVInstruction);

    this.updateService.mo.c8y_Series = this.simSettingsService.allInstructionsArray;
    console.log('mo', this.updateService.mo, this.simSettingsService.allInstructionsArray);
    this.updateService
    .updateSimulatorObject(this.updateService.mo)
    .then((res) => {
      this.simSettingsService.setAllInstructionsSeries(res.c8y_Series);
      console.log('res', res);
      });
  }


  updateCommandQueueInManagedObject(mo: IManagedObject, type: string) {
    this.simulatorervice.updateSimulatorManagedObject(mo).then(
      (res) => {
        console.log(res);
        const alert = {
          text: `${type} updated successfully.`,
          type: "success",
        } as Alert;
        this.alertService.add(alert);
      },
      (error) => {
        const alert = {
          text: `Failed to save selected ${type.toLowerCase()}.`,
          type: "danger",
        } as Alert;
        this.alertService.add(alert);
      }

    );


  }
  

  incrementStep() {
    this.step++;
    switch(this.step){
      case 2: this.readFileStream();break;
      case 4: this.startImport();break;
    }
  }
  
  prepareFileStream(event) {
    console.log(event);
    this.file = event.target.files[0];
  }

  changeDelimiter(event) {
    console.log(event);

  }

  readFileStream() {
    let fileReader = new FileReader();
    fileReader.onload = (e) => {
      let fileContent = String(fileReader.result);
      if(!fileContent.includes(this.delimiter)){
          this.step--;
          console.log('Delimiter not found in CSV');
          return;
      }
      this.dataProperties = fileContent.split('\r\n')[0].split(this.delimiter);

      let data = fileContent.replace(/\r\n/g, ',').split(this.delimiter);
      for (let i = 0; i < this.dataProperties.length; i++){
        this.data.push([]);
        for (let j = i; j < data.length; j += this.dataProperties.length){
          if(j < this.dataProperties.length){ continue; }
          this.data[this.data.length-1].push(data[j]);
        }
        this.dataPoints = this.data[this.data.length - 1].length;
      }
      console.log('data', this.data, this.dataPoints, this.dataProperties, data);
    }
    fileReader.readAsText(this.file);
  }


}
