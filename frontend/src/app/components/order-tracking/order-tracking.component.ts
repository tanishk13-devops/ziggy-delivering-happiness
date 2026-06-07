import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { Order } from '../../models/order.model';

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-tracking.component.html',
  styleUrls: ['./order-tracking.component.css']
})
export class OrderTrackingComponent implements OnInit {
  orders: Order[] = [];
  loading = true;
  orderId?: number;

  steps: ('Pending' | 'Accepted' | 'Preparing' | 'OutForDelivery' | 'Delivered')[] = ['Pending', 'Accepted', 'Preparing', 'OutForDelivery', 'Delivered'];

  // Keep track of active intervals for simulation
  private simulations: Record<number, any> = {};

  constructor(
    private orderService: OrderService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const idParam = params['orderId'];
      this.orderId = idParam ? Number(idParam) : undefined;
      this.loadOrders();
    });
  }

  loadOrders(): void {
    this.loading = true;
    if (this.orderId) {
      this.orderService.getOrderById(this.orderId).subscribe({
        next: (order) => {
          this.orders = [order];
          this.loading = false;
          if (order.status !== 'Delivered') {
            this.startSimulation(order);
          }
        },
        error: () => {
          this.loading = false;
        }
      });
      return;
    }

    this.orderService.getMyOrders().subscribe({
      next: (orders) => {
        this.orders = orders.sort((a, b) => (b.id || 0) - (a.id || 0));
        this.loading = false;
        const latestOrder = this.orders[0];
        if (latestOrder && latestOrder.status !== 'Delivered') {
          this.startSimulation(latestOrder);
        }
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getStepIndex(status: string): number {
    switch (status) {
      case 'Pending':
        return 0;
      case 'Accepted':
        return 1;
      case 'Preparing':
        return 2;
      case 'OutForDelivery':
        return 3;
      case 'Delivered':
        return 4;
      default:
        return -1;
    }
  }

  isStepDone(status: string, stepIndex: number): boolean {
    const current = this.getStepIndex(status);
    return current >= stepIndex;
  }

  // Get scooter SVG translation based on status
  getScooterTransform(status: string): string {
    switch (status) {
      case 'Pending':
        return 'translate(80, 110)';
      case 'Accepted':
        return 'translate(170, 82)';
      case 'Preparing':
        return 'translate(260, 85)';
      case 'OutForDelivery':
        return 'translate(390, 135)';
      case 'Delivered':
        return 'translate(520, 110)';
      default:
        return 'translate(80, 110)';
    }
  }

  // Simulator to demonstrate scooter movement on the SVG road
  startSimulation(order: Order): void {
    if (!order.id) return;
    
    // Clear any existing simulation for this order
    if (this.simulations[order.id]) {
      clearInterval(this.simulations[order.id]);
    }

    const currentStatus = order.status;
    let index = this.getStepIndex(currentStatus);
    
    if (index === -1 || index >= this.steps.length - 1) {
      order.status = 'Pending';
      index = 0;
    }

    this.simulations[order.id] = setInterval(() => {
      index++;
      if (index < this.steps.length) {
        order.status = this.steps[index];
      } else {
        clearInterval(this.simulations[order.id!]);
        delete this.simulations[order.id!];
      }
    }, 2500);
  }
}
