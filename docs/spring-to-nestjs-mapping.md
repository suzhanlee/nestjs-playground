# Spring + JPA → NestJS + TypeORM 매핑 가이드

## Spring ↔ NestJS 개념 매핑

| Spring | NestJS | 설명 |
|--------|--------|------|
| `@RestController` | `@Controller()` | API 엔드포인트 |
| `@Service` | `@Injectable()` | 비즈니스 로직 |
| `@Repository` | `@Injectable()` + Repository 패턴 | 데이터 접근 |
| `@Component` | `@Injectable()` | 일반 의존성 |
| `@Autowired` | 생성자 주입 (자동) | DI |
| `@RequestMapping` | `@Get/@Post/@Put/@Delete()` | 라우팅 |
| `@PathVariable` | `@Param()` | 경로 변수 |
| `@RequestBody` | `@Body()` | 요청 바디 |
| `@RequestParam` | `@Query()` | 쿼리 파라미터 |
| `@Value` | `@Inject()` | 설정값 주입 |
| `@Configuration` | `@Module()` | 모듈 설정 |

## JPA ↔ TypeORM 개념 매핑

| JPA | TypeORM | 설명 |
|-----|---------|------|
| `@Entity` | `@Entity()` | 엔티티 클래스 |
| `@Table` | `@Entity('table_name')` | 테이블 명시 |
| `@Id` | `@PrimaryGeneratedColumn()` | PK |
| `@Column` | `@Column()` | 컬럼 |
| `@GeneratedValue` | `@PrimaryGeneratedColumn()` | 자동 생성 |
| `@ManyToOne` | `@ManyToOne()` | N:1 관계 |
| `@OneToMany` | `@OneToMany()` | 1:N 관계 |
| `@ManyToMany` | `@ManyToMany()` | N:M 관계 |
| `@JoinColumn` | `@JoinColumn()` | 조인 컬럼 |
| `Repository<T>` | `Repository<T>` (TypeORM) | 레포지토리 |
| `EntityManager` | `DataSource` / `EntityManager` | EM |
| `@Transactional` | `@Transaction()` | 트랜잭션 |
| `CriteriaBuilder` | `QueryBuilder` | 동적 쿼리 |

## 예시 코드 비교

### Entity

**JPA (Spring)**
```java
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    @OneToMany(mappedBy = "user")
    private List<Order> orders;
}
```

**TypeORM (NestJS)**
```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  name: string;

  @Column({ unique: true, nullable: false })
  email: string;

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];
}
```

### Repository

**JPA (Spring)**
```java
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findByNameContaining(String name);
}
```

**TypeORM (NestJS)**
```typescript
@Injectable()
export class UserRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } });
  }

  async findByNameContaining(name: string): Promise<User[]> {
    return this.find({ where: { name: Like(`%${name}%`) } });
  }
}
```

### Service

**JPA (Spring)**
```java
@Service
@Transactional
public class UserService {
    @Autowired
    private UserRepository userRepository;

    public User create(CreateUserDto dto) {
        User user = new User();
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        return userRepository.save(user);
    }
}
```

**TypeORM (NestJS)**
```typescript
@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(dto);
    return this.userRepository.save(user);
  }
}
```

### Controller

**JPA (Spring)**
```java
@RestController
@RequestMapping("/users")
public class UserController {
    @Autowired
    private UserService userService;

    @PostMapping
    public User create(@RequestBody CreateUserDto dto) {
        return userService.create(dto);
    }

    @GetMapping("/{id}")
    public User getById(@PathVariable Long id) {
        return userService.findById(id);
    }
}
```

**TypeORM (NestJS)**
```typescript
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.userService.findById(+id);
  }
}
```

### Module 설정

**Spring (Java Config)**
```java
@Configuration
@EnableJpaRepositories("com.example.repository")
@EntityScan("com.example.entity")
public class AppConfig {
    // Bean 정의들...
}
```

**NestJS (Module)**
```typescript
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}
```
