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

  // Ziggy tab state
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

  // Ziggy Gold activation
  joinGold(): void {
    if (!this.authService.isLoggedIn()) {
      this.goldMessage = 'Please login or register to join Ziggy Gold!';
      return;
    }
    this.authService.setGoldMember(true);
    this.goldMessage = 'Congratulations! You are now a Ziggy Gold Member! 🏅';
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

  readonly foodImageMap: Record<string, string> = {
    'paneer tikka': 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?q=80&w=600',
    'crispy corn': 'https://www.indianhealthyrecipes.com/wp-content/uploads/2023/09/crispy-corn.webp',
    'veg spring roll': 'https://www.vegrecipesofindia.com/wp-content/uploads/2015/10/veg-spring-rolls-recipe.jpg',
    'chicken 65': 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?q=80&w=600',
    'hara bhara kebab': 'https://www.indianhealthyrecipes.com/wp-content/uploads/2021/05/hara-bhara-kabab.jpg',
    'peri peri fries': 'https://images.unsplash.com/photo-1576107232684-1279f390859f?q=80&w=600',
    'chilli paneer': 'https://howtomakerecipes.com/wp-content/uploads/2023/01/chilli-paneer-starter-recipe1.jpg',
    'honey chilli potato': 'https://images.unsplash.com/photo-1604908554027-0c0cfa5a9b43',
    'tandoori wings': 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?q=80&w=600',
    'stuffed mushrooms': 'https://blackberrybabe.com/wp-content/uploads/2023/11/Stuffed-Portobello-Mushrooms.jpg',
    'butter chicken': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?q=80&w=600',
    'kadai paneer': 'https://images.unsplash.com/photo-1596797038530-2c107229654b?q=80&w=600',
    'dal makhani': 'https://www.indianhealthyrecipes.com/wp-content/uploads/2022/02/dal-makhani-recipe.jpg',
    'chicken biryani': 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?q=80&w=600',
    'veg biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=600',
    'mutton rogan josh': 'https://theyellowdaal.com/wp-content/uploads/2021/01/1611762173130.jpg',
    'prawn curry': 'https://www.whiskaffair.com/wp-content/uploads/2023/02/Shrimp-Masala-2-3.jpg',
    'thai green curry': 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?q=80&w=600',
    'veg alfredo pasta': 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?q=80&w=600',
    'paneer butter masala': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=600',
    'fish tikka masala': 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=600',
    'hyderabadi dum biryani': 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=600',
    'chole bhature combo': 'https://images.unsplash.com/photo-1626500155537-93690c24099e',
    'rajma chawal bowl': 'https://images.unsplash.com/photo-1617093727343-374698b1b08d',
    'schezwan noodles': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?q=80&w=600',
    'gulab jamun': 'https://pipingpotcurry.com/wp-content/uploads/2023/12/Gulab-Jamun-Recipe-Piping-Pot-Curry.jpg',
    'brownie sundae': 'https://www.bakerykart.com/upload/recipe/large/brownie-sundae-recipe.jpg',
    'rasmalai': 'https://aromaticessence.co/wp-content/uploads/2018/05/49E95995-028D-44D2-9252-2CDA545120D8.jpeg',
    'chocolate mousse': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=600',
    'kulfi falooda': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?q=80&w=600',
    'cheesecake slice': 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=600',
    'shahi tukda': 'https://www.indianhealthyrecipes.com/wp-content/uploads/2022/02/shahi-tukda-recipe.jpg',
    'tiramisu cup': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=80&w=600',
    'masala chaas': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600',
    'lemon iced tea': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=600',
    'cold coffee': 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=600',
    'mango shake': 'https://images.unsplash.com/photo-1553530979-7ee52a2670c4?q=80&w=600',
    'fresh lime soda': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=600',
    'filter coffee': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=600',
    'mint mojito': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=600',
    'hot chocolate': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=600'
  };

  private extractBaseDishName(name: string): string {
    return (name || '')
      .split(' - ')[0]
      .trim()
      .toLowerCase();
  }

  getFoodImageUrl(food: Food): string {
    const isPlaceholder = !food?.imageUrl || food.imageUrl.trim() === '' || food.imageUrl.includes('dummyimage.com');
    if (!isPlaceholder) {
      return food.imageUrl!;
    }
    return this.foodImageMap[this.extractBaseDishName(food?.name || '')] || this.foodPlaceholder;
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
