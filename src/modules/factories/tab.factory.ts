import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Tab, TabFactory, _ } from '@c8y/ngx-components';
import { Observable } from 'rxjs';

@Injectable()
export class CustomTabFactory implements TabFactory {

    constructor(
        private router: Router
    ) { }

    get(): Observable<Tab[] | Tab> | Promise<Tab[] | Tab> | Tab[] | Tab {
        const tabArray = new Array<Tab>();
        const url = this.router.url;
        
        if (url && (url.match(/\d+/g))) {
            const id = ((url.match(/\d+/g))[0]).toString();
            // tabArray.push(

            //     {
            //         label: 'Instructions',
            //         icon: 'sort-amount-asc',
            //         path: `createSim/${id}/instructions`,
            //         priority: 100
            //     },
            //     {
            //         label: 'Supported Operations',
            //         icon: 'gamepad',
            //         path: `createSim/${id}/operations`,
            //         priority: 99
            //     }
            // );
        }
        return tabArray;
    }
}