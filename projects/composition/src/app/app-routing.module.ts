import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InputPageComponent } from './pages/input-page/input-page.component';

const routes: Routes = [
  {
    path: 'input',
    title: 'Input',
    component: InputPageComponent,
  },
  { path: '**', redirectTo: 'input' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
