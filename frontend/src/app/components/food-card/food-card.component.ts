import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Food } from '../../models/food.model';

@Component({
  selector: 'app-food-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './food-card.component.html',
  styleUrls: ['./food-card.component.css']
})
export class FoodCardComponent {
  @Input({ required: true }) food!: Food;
  @Output() add = new EventEmitter<Food>();
  isFavorite = false;
  isAdding = false;

  readonly placeholder = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80';

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

  get imageUrl(): string {
    const isPlaceholder = !this.food?.imageUrl || this.food.imageUrl.trim() === '' || this.food.imageUrl.includes('dummyimage.com');
    if (!isPlaceholder) {
      return this.food.imageUrl!;
    }
    return this.foodImageMap[this.extractBaseDishName(this.food?.name || '')] || this.placeholder;
  }

  private getSignature(): number {
    const seed = `${this.food.id}-${this.food.restaurantId}-${this.food.name}`;
    let hash = 0;

    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash |= 0;
    }

    return Math.abs(hash % 100000);
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = this.placeholder;
  }

  onAdd(): void {
    this.isAdding = true;
    setTimeout(() => (this.isAdding = false), 280);
    this.add.emit(this.food);
  }

  toggleFavorite(): void {
    this.isFavorite = !this.isFavorite;
  }
}
