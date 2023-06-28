// import {
//   Directive,
//   ComponentFactoryResolver,
//   ViewContainerRef
// } from '@angular/core';
// import { SomeDynamicComponent } from './some-dynamic/some-dynamic.component';

// @Directive({
//   selector: '[myDirective]'
// })
// export class MyDirective {
//   constructor(
//     private viewContainerRef: ViewContainerRef,
//     private componentFactoryResolver: ComponentFactoryResolver
//   ) {
//     let componentFactory =
//       componentFactoryResolver.resolveComponentFactory(SomeDynamicComponent);
//     let counter = 0;
//     setInterval(() => {
//       if (counter++ < 10) {
//         viewContainerRef.createComponent(componentFactory);
//       } else {
//         counter = 0;
//         viewContainerRef.clear();
//       }
//     }, 1000);
//   }
// }
