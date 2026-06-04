import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Restaurant } from '../../models/restaurant.model';
import { RestaurantService } from '../../services/restaurant.service';

export interface PremiumRestaurant extends Restaurant {
  costForTwo: number;
  cuisines: string;
  isVeg: boolean;
  isGold: boolean;
  knownFor: string;
  popularDishes: string;
}

@Component({
  selector: 'app-restaurant-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './restaurant-list.component.html',
  styleUrls: ['./restaurant-list.component.css']
})
export class RestaurantListComponent implements OnInit {
  allRestaurants: PremiumRestaurant[] = [];
  restaurants: PremiumRestaurant[] = [];
  errorMessage = '';
  search = '';
  locations: string[] = [];
  selectedLocation = '';
  sortBy: 'recommended' | 'ratingDesc' | 'ratingAsc' | 'nameAsc' = 'recommended';
  loading = false;

  // Filter Pill States
  filterRating4 = false;
  filterPureVeg = false;
  filterGold = false;
  filterCostSort: 'none' | 'lowToHigh' | 'highToLow' = 'none';

  constructor(private restaurantService: RestaurantService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.restaurantService.getRestaurants(this.search).subscribe({
      next: (data) => {
        // Map standard restaurants to PremiumRestaurants with stable dynamic properties
        this.allRestaurants = data.map(r => {
          const id = r.id || 1;
          const costForTwo = ((id * 150) % 600) + 250; // Stable cost between ₹250 and ₹850
          const isVeg = id % 3 === 0; // Stable veggie flag (every 3rd veg)
          const isGold = id % 2 === 0; // Stable Gold partner flag (every even Gold)

          let cuisines = 'North Indian, Fast Food, Chinese';
          if (id % 4 === 0) cuisines = 'North Indian, Biryani, Mughlai';
          else if (id % 4 === 1) cuisines = 'Burgers, Fast Food, Beverages';
          else if (id % 4 === 2) cuisines = 'Pizza, Italian, Fast Food';
          else if (id % 4 === 3) cuisines = 'Chinese, Asian, Thai';

          let knownFor = 'Stellar ambiance, live sports screening, and artisanal mocktails.';
          if (id % 3 === 1) knownFor = 'Decadent desserts, organic ingredients, and prompt service.';
          else if (id % 3 === 2) knownFor = 'Gourmet plating, authentic flavors, and family-friendly environment.';

          let popularDishes = 'Classic Cheese Pizza, Truffle Fries, Blueberry Cheesecake';
          if (id % 3 === 1) popularDishes = 'Paneer Tikka, Butter Chicken, Garlic Naan';
          else if (id % 3 === 2) popularDishes = 'Schezwan Noodles, Spring Rolls, Dim Sums';

          return {
            ...r,
            costForTwo,
            cuisines,
            isVeg,
            isGold,
            knownFor,
            popularDishes
          } as PremiumRestaurant;
        });

        this.locations = [...new Set(data.map(r => r.location).filter(Boolean) as string[])].sort();
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.allRestaurants = [];
        this.restaurants = [];
        this.errorMessage = 'Could not load restaurants. Start backend API and try again.';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let list = [...this.allRestaurants];

    // Search term & location filters
    if (this.selectedLocation) {
      list = list.filter(r => r.location === this.selectedLocation);
    }

    // Rating pill filter
    if (this.filterRating4) {
      list = list.filter(r => (r.rating || 0) >= 4.0);
    }

    // Pure Veg pill filter
    if (this.filterPureVeg) {
      list = list.filter(r => r.isVeg);
    }

    // Gold Partners pill filter
    if (this.filterGold) {
      list = list.filter(r => r.isGold);
    }

    // Cost Sort pill priority, fallback to general sort drop-down
    if (this.filterCostSort === 'lowToHigh') {
      list.sort((a, b) => a.costForTwo - b.costForTwo);
    } else if (this.filterCostSort === 'highToLow') {
      list.sort((a, b) => b.costForTwo - a.costForTwo);
    } else {
      switch (this.sortBy) {
        case 'ratingDesc':
          list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case 'ratingAsc':
          list.sort((a, b) => (a.rating || 0) - (b.rating || 0));
          break;
        case 'nameAsc':
          list.sort((a, b) => a.name.localeCompare(b.name));
          break;
        default:
          break;
      }
    }

    this.restaurants = list;
  }

  toggleFilterRating(): void {
    this.filterRating4 = !this.filterRating4;
    this.applyFilters();
  }

  toggleFilterPureVeg(): void {
    this.filterPureVeg = !this.filterPureVeg;
    this.applyFilters();
  }

  toggleFilterGold(): void {
    this.filterGold = !this.filterGold;
    this.applyFilters();
  }

  toggleCostSort(): void {
    if (this.filterCostSort === 'none') {
      this.filterCostSort = 'lowToHigh';
    } else if (this.filterCostSort === 'lowToHigh') {
      this.filterCostSort = 'highToLow';
    } else {
      this.filterCostSort = 'none';
    }
    this.applyFilters();
  }

  clearFilters(): void {
    this.selectedLocation = '';
    this.sortBy = 'recommended';
    this.filterRating4 = false;
    this.filterPureVeg = false;
    this.filterGold = false;
    this.filterCostSort = 'none';
    this.applyFilters();
  }
}
