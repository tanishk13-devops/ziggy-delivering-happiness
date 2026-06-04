import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FoodService } from '../../services/food.service';
import { CartService } from '../../services/cart.service';
import { RestaurantService } from '../../services/restaurant.service';
import { AuthService } from '../../services/auth.service';
import { Food } from '../../models/food.model';
import { CartItem } from '../../models/cart.model';
import { PremiumRestaurant } from '../restaurant-list/restaurant-list.component';

interface MenuFoodItem extends Food {
  image: string;
}

interface Review {
  author: string;
  rating: number;
  date: string;
  comment: string;
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {
  restaurantId = 1;
  restaurant: PremiumRestaurant | null = null;
  foods: MenuFoodItem[] = [];
  categories: string[] = [];
  selectedCategory = '';
  searchTerm = '';
  sortBy: 'recommended' | 'priceLowToHigh' | 'priceHighToLow' | 'nameAsc' = 'recommended';
  filteredFoods: MenuFoodItem[] = [];
  loading = true;
  errorMessage = '';
  readonly skeletonItems = Array.from({ length: 8 });
  addSuccessMessage = '';

  // Menu Tabs: Delivery vs Dining Booking vs Reviews
  menuTab: 'delivery' | 'dining' | 'reviews' = 'delivery';

  // Table Booking variables
  bookingDate = '';
  bookingTime = '19:30';
  bookingGuests = 2;
  bookingTicket: any = null;

  // Mock Reviews
  deliveryReviews: Review[] = [
    { author: 'Rahul Sharma', rating: 5, date: 'Yesterday', comment: 'Fastest delivery ever! Food was piping hot and package was sealed nicely.' },
    { author: 'Sneha Patel', rating: 4, date: '3 days ago', comment: 'Loved the Schezwan noodles. The portion was huge, could use a bit more spice.' },
    { author: 'Amit Gupta', rating: 4.5, date: '1 week ago', comment: 'Dal Makhani was incredibly creamy. Standard delivery was prompt (around 22 minutes).' }
  ];

  diningReviews: Review[] = [
    { author: 'Pooja Hegde', rating: 5, date: 'Last weekend', comment: 'Elegant ambiance, stellar light arrangement, and the live music was outstanding! Reservation was verified instantly.' },
    { author: 'Vikram Singh', rating: 4.8, date: '2 weeks ago', comment: 'Extremely polite staff. The chef recommended special recipes. Perfect spot for family dinners.' },
    { author: 'Nisha K.', rating: 4.2, date: '3 weeks ago', comment: 'Beautiful glass ceiling view. It gets quite crowded on Saturdays, so definitely book a table beforehand.' }
  ];

  readonly defaultFoodImage = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1200';
  readonly foodImageMap: Record<string, string> = {
    'paneer tikka': 'https://images.pexels.com/photos/7625056/pexels-photo-7625056.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'crispy corn': 'https://www.indianhealthyrecipes.com/wp-content/uploads/2023/09/crispy-corn.webp',
    'veg spring roll': 'https://www.vegrecipesofindia.com/wp-content/uploads/2015/10/veg-spring-rolls-recipe.jpg',
    'chicken 65': 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'hara bhara kebab': 'https://www.indianhealthyrecipes.com/wp-content/uploads/2021/05/hara-bhara-kabab.jpg',
    'peri peri fries': 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'chilli paneer': 'https://howtomakerecipes.com/wp-content/uploads/2023/01/chilli-paneer-starter-recipe1.jpg',
    'honey chilli potato': 'https://images.unsplash.com/photo-1604908554027-0c0cfa5a9b43',
    'tandoori wings': 'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'stuffed mushrooms': 'https://blackberrybabe.com/wp-content/uploads/2023/11/Stuffed-Portobello-Mushrooms.jpg',
    'butter chicken': 'https://images.pexels.com/photos/7625056/pexels-photo-7625056.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'kadai paneer': 'https://images.pexels.com/photos/9609838/pexels-photo-9609838.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'dal makhani': 'https://www.indianhealthyrecipes.com/wp-content/uploads/2022/02/dal-makhani-recipe.jpg',
    'chicken biryani': 'https://images.pexels.com/photos/12737656/pexels-photo-12737656.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'veg biryani': 'https://images.pexels.com/photos/5410401/pexels-photo-5410401.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'mutton rogan josh': 'https://theyellowdaal.com/wp-content/uploads/2021/01/1611762173130.jpg',
    'prawn curry': 'https://www.whiskaffair.com/wp-content/uploads/2023/02/Shrimp-Masala-2-3.jpg',
    'thai green curry': 'https://images.pexels.com/photos/699953/pexels-photo-699953.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'veg alfredo pasta': 'https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'paneer butter masala': 'https://images.pexels.com/photos/9609842/pexels-photo-9609842.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'fish tikka masala': 'https://images.pexels.com/photos/3296279/pexels-photo-3296279.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'hyderabadi dum biryani': 'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'chole bhature combo': 'https://images.unsplash.com/photo-1626500155537-93690c24099e',
    'rajma chawal bowl': 'https://images.unsplash.com/photo-1617093727343-374698b1b08d',
    'schezwan noodles': 'https://images.pexels.com/photos/2347311/pexels-photo-2347311.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'gulab jamun': 'https://pipingpotcurry.com/wp-content/uploads/2023/12/Gulab-Jamun-Recipe-Piping-Pot-Curry.jpg',
    'brownie sundae': 'https://www.bakerykart.com/upload/recipe/large/brownie-sundae-recipe.jpg',
    'rasmalai': 'https://aromaticessence.co/wp-content/uploads/2018/05/49E95995-028D-44D2-9252-2CDA545120D8.jpeg',
    'chocolate mousse': 'https://images.pexels.com/photos/4110008/pexels-photo-4110008.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'kulfi falooda': 'https://images.pexels.com/photos/1556401/pexels-photo-1556401.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'cheesecake slice': 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'shahi tukda': 'https://www.indianhealthyrecipes.com/wp-content/uploads/2022/02/shahi-tukda-recipe.jpg',
    'tiramisu cup': 'https://images.pexels.com/photos/6880219/pexels-photo-6880219.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'masala chaas': 'https://images.pexels.com/photos/5946965/pexels-photo-5946965.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'lemon iced tea': 'https://images.pexels.com/photos/1410142/pexels-photo-1410142.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'cold coffee': 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'mango shake': 'https://images.pexels.com/photos/5946972/pexels-photo-5946972.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'fresh lime soda': 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'filter coffee': 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'mint mojito': 'https://images.pexels.com/photos/1470520/pexels-photo-1470520.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'hot chocolate': 'https://images.pexels.com/photos/302904/pexels-photo-302904.jpeg?auto=compress&cs=tinysrgb&w=1200'
  };

  constructor(
    private foodService: FoodService,
    private cartService: CartService,
    private restaurantService: RestaurantService,
    public authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Set default booking date to today
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    this.bookingDate = `${yyyy}-${mm}-${dd}`;

    this.route.paramMap.subscribe(params => {
      this.restaurantId = Number(params.get('restaurantId') || 1);
      this.loadRestaurantDetails();
      this.loadFoods();
    });
  }

  loadRestaurantDetails(): void {
    this.restaurantService.getRestaurant(this.restaurantId).subscribe({
      next: (r) => {
        const id = r.id || 1;
        const costForTwo = ((id * 150) % 600) + 250;
        const isVeg = id % 3 === 0;
        const isGold = id % 2 === 0;

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

        this.restaurant = {
          ...r,
          costForTwo,
          cuisines,
          isVeg,
          isGold,
          knownFor,
          popularDishes
        } as PremiumRestaurant;
      }
    });
  }

  loadFoods(): void {
    this.loading = true;
    this.errorMessage = '';

    this.foodService.getRestaurantMenu(this.restaurantId).subscribe({
      next: (foods) => {
        this.foods = this.mapFoodsWithUniqueImages(foods);
        this.extractCategories();
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.foods = [];
        this.filteredFoods = [];
        this.categories = [];
        this.errorMessage = 'Unable to load menu right now. Please try again.';
        this.loading = false;
      }
    });
  }

  extractCategories(): void {
    this.categories = [...new Set(this.foods.map(f => f.category?.name || f.categoryName).filter(Boolean) as string[])];
  }

  setMenuTab(tab: 'delivery' | 'dining' | 'reviews'): void {
    this.menuTab = tab;
  }

  // Table Reservation logic
  bookTable(): void {
    if (!this.authService.isLoggedIn()) {
      alert('Please login to reserve a table.');
      return;
    }
    this.bookingTicket = {
      restaurantName: this.restaurant?.name || 'Restaurant Partner',
      restaurantLocation: this.restaurant?.location || 'Nearby',
      guestName: this.authService.getCurrentUser()?.name || 'Guest',
      date: this.bookingDate,
      time: this.bookingTime,
      guestsCount: this.bookingGuests,
      ticketId: 'ZG-' + Math.floor(100000 + Math.random() * 900000)
    };
  }

  cancelBooking(): void {
    this.bookingTicket = null;
  }

  filterByCategory(): void {
    this.applyFilters();
  }

  onCategoryChange(): void {
    this.filterByCategory();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.selectedCategory = '';
    this.searchTerm = '';
    this.sortBy = 'recommended';
    this.applyFilters();
  }

  private applyFilters(): void {
    let list = [...this.foods];

    if (this.selectedCategory) {
      list = list.filter(f => (f.category?.name || f.categoryName) === this.selectedCategory);
    }

    const search = this.searchTerm.trim().toLowerCase();
    if (search) {
      list = list.filter(f =>
        f.name.toLowerCase().includes(search) ||
        (f.description || '').toLowerCase().includes(search));
    }

    switch (this.sortBy) {
      case 'priceLowToHigh':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'priceHighToLow':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'nameAsc':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    this.filteredFoods = list;
  }

  addToCart(food: Food): void {
    if (food.id) {
      const cartItem: CartItem = {
        foodItemId: food.id,
        price: food.price,
        quantity: 1
      };
      this.cartService.addToCart(cartItem).subscribe({
        next: () => {
          this.addSuccessMessage = `${food.name} added to cart`;
          setTimeout(() => (this.addSuccessMessage = ''), 1200);
        },
        error: (err) => {
          if (err?.status === 401) {
            this.router.navigate(['/login']);
            return;
          }
        }
      });
    }
  }

  onImageError(item: MenuFoodItem, index: number): void {
    item.image = this.defaultFoodImage;
  }

  trackByFood(index: number, item: MenuFoodItem): number {
    return item.id ?? index;
  }

  private mapFoodsWithUniqueImages(foods: Food[]): MenuFoodItem[] {
    return foods.map((item) => {
      const baseName = this.extractBaseDishName(item.name);
      const image = this.foodImageMap[baseName] || this.defaultFoodImage;

      return {
        ...item,
        image
      };
    });
  }

  private extractBaseDishName(name: string): string {
    return (name || '')
      .split(' - ')[0]
      .trim()
      .toLowerCase();
  }
}
