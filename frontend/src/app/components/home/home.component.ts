import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RestaurantService } from '../../services/restaurant.service';
import { FoodService } from '../../services/food.service';
import { AuthService } from '../../services/auth.service';
import { Restaurant } from '../../models/restaurant.model';
import { Food } from '../../models/food.model';
import { forkJoin, of } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

interface NightlifeEvent {
  id: number;
  name: string;
  venue: string;
  date: string;
  price: number;
  image: string;
  description: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  title = 'Ziggy';
  animatedHeroText = 'Hot meals from your favorite restaurants, delivered in minutes.';
  readonly heroText = 'Hot meals from your favorite restaurants, delivered in minutes.';

  featuredRestaurants: Restaurant[] = [];
  trendingFoods: Food[] = [];
  loadingFeatured = true;
  loadingTrending = true;

  restaurantsCount = 0;
  deliveredOrdersCount = 0;
  activeSlide = 0;
  apiError = '';
  readonly foodPlaceholder = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80';

  // Zomato tab state
  activeTab: 'delivery' | 'dining' | 'nightlife' = 'delivery';

  // Gold Portal
  goldMessage = '';

  // Dining Out Table booking variables
  selectedRestaurantForBooking: Restaurant | null = null;
  bookingDate = '';
  bookingTime = '19:30';
  bookingGuests = 2;
  bookingTicket: any = null;

  // Nightlife events variables
  selectedEventForBooking: NightlifeEvent | null = null;
  eventTicketsCount = 2;
  eventTicket: any = null;

  features = [
    'Fresh, chef-crafted meals every day',
    'Fast delivery with live order tracking',
    'Secure, simple checkout experience',
    'Curated menus with real food photos'
  ];

  nightlifeEvents: NightlifeEvent[] = [
    {
      id: 1,
      name: 'Retro DJ Beats & Neon Night',
      venue: 'Club Neon, Indiranagar',
      date: 'Friday, 8:00 PM onwards',
      price: 999,
      image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
      description: 'Dance to the greatest hits of the 80s and 90s with custom neon lighting.'
    },
    {
      id: 2,
      name: 'Unplugged Sufi & Ghazal Evening',
      venue: 'The Courtyard Lounge, Koramangala',
      date: 'Saturday, 7:30 PM',
      price: 1499,
      image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=600&q=80',
      description: 'A soulful evening of Sufi melodies and Ghazals with live acoustic instruments.'
    },
    {
      id: 3,
      name: 'Standup Comedy Club Special',
      venue: 'The Laugh Factory, HSR Layout',
      date: 'Sunday, 6:00 PM',
      price: 499,
      image: 'https://images.unsplash.com/photo-1585699324551-f6c309eed262?auto=format&fit=crop&w=600&q=80',
      description: 'Laughter riot with top tier stand-up comedians sharing their hilarious stories.'
    }
  ];

  constructor(
    private restaurantService: RestaurantService,
    private foodService: FoodService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    // Set default booking date to today
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    this.bookingDate = `${yyyy}-${mm}-${dd}`;

    this.loadFeaturedRestaurants();
  }

  ngOnDestroy(): void {
    // no-op
  }

  selectTab(tab: 'delivery' | 'dining' | 'nightlife'): void {
    this.activeTab = tab;
    // reset bookings on tab change
    this.selectedRestaurantForBooking = null;
    this.bookingTicket = null;
    this.selectedEventForBooking = null;
    this.eventTicket = null;
  }

  // Zomato Gold activation
  joinGold(): void {
    if (!this.authService.isLoggedIn()) {
      this.goldMessage = 'Please login or register to join Zomato Gold!';
      return;
    }
    this.authService.setGoldMember(true);
    this.goldMessage = 'Congratulations! You are now a Zomato Gold Member! 🏅';
  }

  // Table Booking
  startTableBooking(restaurant: Restaurant): void {
    this.selectedRestaurantForBooking = restaurant;
    this.bookingTicket = null;
  }

  bookTable(): void {
    if (!this.authService.isLoggedIn()) {
      alert('Please login to book a table.');
      return;
    }
    this.bookingTicket = {
      restaurantName: this.selectedRestaurantForBooking?.name,
      restaurantLocation: this.selectedRestaurantForBooking?.location,
      guestName: this.authService.getCurrentUser()?.name || 'Guest',
      date: this.bookingDate,
      time: this.bookingTime,
      guestsCount: this.bookingGuests,
      ticketId: 'ZG-' + Math.floor(100000 + Math.random() * 900000)
    };
  }

  cancelBooking(): void {
    this.selectedRestaurantForBooking = null;
    this.bookingTicket = null;
  }

  // Event Booking
  startEventBooking(event: NightlifeEvent): void {
    this.selectedEventForBooking = event;
    this.eventTicket = null;
  }

  bookEventTicket(): void {
    if (!this.authService.isLoggedIn()) {
      alert('Please login to book tickets.');
      return;
    }
    const isGold = this.authService.isGoldMember();
    const eventPrice = this.selectedEventForBooking?.price || 0;
    const rawTotal = eventPrice * this.eventTicketsCount;
    const discount = isGold ? Math.round(rawTotal * 0.1) : 0;
    const finalPrice = rawTotal - discount;

    this.eventTicket = {
      eventName: this.selectedEventForBooking?.name,
      venue: this.selectedEventForBooking?.venue,
      date: this.selectedEventForBooking?.date,
      ticketsCount: this.eventTicketsCount,
      ticketId: 'EV-' + Math.floor(100000 + Math.random() * 900000),
      rawTotal,
      discount,
      finalPrice,
      guestName: this.authService.getCurrentUser()?.name || 'Guest'
    };
  }

  cancelEventBooking(): void {
    this.selectedEventForBooking = null;
    this.eventTicket = null;
  }

  nextSlide(): void {
    if (!this.trendingFoods.length) return;
    this.activeSlide = (this.activeSlide + 1) % this.trendingFoods.length;
  }

  prevSlide(): void {
    if (!this.trendingFoods.length) return;
    this.activeSlide = this.activeSlide === 0 ? this.trendingFoods.length - 1 : this.activeSlide - 1;
  }

  goToSlide(index: number): void {
    this.activeSlide = index;
  }

  getFoodImageUrl(food: Food): string {
    if (!food?.name?.trim()) {
      return this.foodPlaceholder;
    }

    const dishSlug = food.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

    const signature = this.getFoodSignature(food);
    return `https://source.unsplash.com/400x300/?${encodeURIComponent(dishSlug)}&sig=${signature}`;
  }

  onFoodImageError(event: Event): void {
    (event.target as HTMLImageElement).src = this.foodPlaceholder;
  }

  private getFoodSignature(food: Food): number {
    const seed = `${food.id}-${food.restaurantId}-${food.name}`;
    let hash = 0;

    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash |= 0;
    }

    return Math.abs(hash % 100000);
  }

  private loadFeaturedRestaurants(): void {
    this.restaurantService.getRestaurants()
      .pipe(retry({ count: 2, delay: 1500 }))
      .subscribe({
      next: (data) => {
        this.apiError = '';
        this.featuredRestaurants = data.slice(0, 6);
        this.loadingFeatured = false;
        this.animateCounter('restaurants', data.length);
        this.animateCounter('orders', Math.max(1800, data.length * 320));
        this.loadTrendingFoods(this.featuredRestaurants.map(r => r.id).slice(0, 3));
      },
      error: () => {
        this.loadingFeatured = false;
        this.loadingTrending = false;
        this.apiError = 'Backend is waking up. Please refresh in a few seconds.';
      }
    });
  }

  private loadTrendingFoods(restaurantIds: number[]): void {
    if (!restaurantIds.length) {
      this.loadingTrending = false;
      return;
    }

    const requests = restaurantIds.map(id => this.foodService.getRestaurantMenu(id).pipe(catchError(() => of([] as Food[]))));
    forkJoin(requests).subscribe({
      next: (foodGroups) => {
        this.trendingFoods = foodGroups
          .flat()
          .filter(f => f.isAvailable !== false)
          .slice(0, 10);

        this.loadingTrending = false;
      },
      error: () => {
        this.loadingTrending = false;
      }
    });
  }

  private animateCounter(type: 'restaurants' | 'orders', target: number): void {
    const duration = 1400;
    const steps = 40;
    const increment = Math.ceil(target / steps);
    let current = 0;

    const timer = setInterval(() => {
      current = Math.min(current + increment, target);
      if (type === 'restaurants') {
        this.restaurantsCount = current;
      } else {
        this.deliveredOrdersCount = current;
      }

      if (current >= target) {
        clearInterval(timer);
      }
    }, Math.floor(duration / steps));
  }
}
