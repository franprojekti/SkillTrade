-- ============================================================
-- SkillTrade — Skills Seed Data (~200 skills)
-- ============================================================

INSERT INTO public.skills (canonical_name, slug, category, aliases) VALUES

-- ============================================================
-- TECHNOLOGY
-- ============================================================
('Web Development', 'web-development', 'Technology', ARRAY['web dev', 'website development', 'web developmant', 'webdev', 'frontend', 'front end']),
('Mobile Development', 'mobile-development', 'Technology', ARRAY['mobile dev', 'app development', 'ios android development']),
('iOS Development', 'ios-development', 'Technology', ARRAY['ios dev', 'swift', 'xcode', 'apple development']),
('Android Development', 'android-development', 'Technology', ARRAY['android dev', 'kotlin', 'java android']),
('React', 'react', 'Technology', ARRAY['reactjs', 'react.js', 'react js']),
('Next.js', 'nextjs', 'Technology', ARRAY['next js', 'nextjs development']),
('Vue.js', 'vuejs', 'Technology', ARRAY['vue', 'vue js', 'vuejs development']),
('Angular', 'angular', 'Technology', ARRAY['angularjs', 'angular js']),
('Node.js', 'nodejs', 'Technology', ARRAY['node', 'node js', 'nodejs backend']),
('Python', 'python', 'Technology', ARRAY['python programming', 'python dev', 'py']),
('JavaScript', 'javascript', 'Technology', ARRAY['js', 'javascript programming', 'vanilla js']),
('TypeScript', 'typescript', 'Technology', ARRAY['ts', 'typescript programming']),
('PHP', 'php', 'Technology', ARRAY['php development', 'php programming']),
('Ruby on Rails', 'ruby-on-rails', 'Technology', ARRAY['rails', 'ruby', 'ror']),
('Django', 'django', 'Technology', ARRAY['django python', 'django framework']),
('Laravel', 'laravel', 'Technology', ARRAY['laravel php', 'laravel framework']),
('SQL / Databases', 'sql-databases', 'Technology', ARRAY['sql', 'databases', 'database design', 'mysql', 'postgresql', 'postgres', 'database management']),
('Data Science', 'data-science', 'Technology', ARRAY['data analysis', 'data analytics', 'ds']),
('Machine Learning', 'machine-learning', 'Technology', ARRAY['ml', 'ai development', 'deep learning', 'neural networks']),
('Artificial Intelligence', 'artificial-intelligence', 'Technology', ARRAY['ai', 'ai engineering']),
('Data Engineering', 'data-engineering', 'Technology', ARRAY['data pipelines', 'etl', 'data infrastructure']),
('DevOps', 'devops', 'Technology', ARRAY['dev ops', 'ci/cd', 'deployment automation']),
('Cloud Computing', 'cloud-computing', 'Technology', ARRAY['aws', 'azure', 'google cloud', 'gcp', 'cloud infrastructure']),
('Cybersecurity', 'cybersecurity', 'Technology', ARRAY['cyber security', 'infosec', 'information security', 'security']),
('Linux / Unix', 'linux-unix', 'Technology', ARRAY['linux', 'unix', 'bash', 'shell scripting', 'linux admin']),
('Docker / Kubernetes', 'docker-kubernetes', 'Technology', ARRAY['docker', 'kubernetes', 'k8s', 'containerization']),
('Game Development', 'game-development', 'Technology', ARRAY['gamedev', 'unity', 'unreal engine', 'game dev']),
('Embedded Systems', 'embedded-systems', 'Technology', ARRAY['arduino', 'raspberry pi', 'microcontrollers', 'iot']),
('Blockchain', 'blockchain', 'Technology', ARRAY['web3', 'solidity', 'smart contracts', 'ethereum', 'crypto development']),
('API Development', 'api-development', 'Technology', ARRAY['rest api', 'graphql', 'api design']),
('UI/UX Development', 'ui-ux-development', 'Technology', ARRAY['frontend development', 'css', 'html css', 'responsive design']),
('WordPress', 'wordpress', 'Technology', ARRAY['wp', 'wordpress development', 'wordpress design']),
('SEO / Technical SEO', 'seo-technical', 'Technology', ARRAY['technical seo', 'search engine optimization', 'seo']),
('Git / Version Control', 'git-version-control', 'Technology', ARRAY['git', 'github', 'version control']),
('Testing / QA', 'testing-qa', 'Technology', ARRAY['qa', 'software testing', 'test automation', 'quality assurance']),

-- ============================================================
-- DESIGN
-- ============================================================
('Graphic Design', 'graphic-design', 'Design', ARRAY['graphics', 'visual design', 'graphic art']),
('UI Design', 'ui-design', 'Design', ARRAY['user interface design', 'interface design', 'app design']),
('UX Design', 'ux-design', 'Design', ARRAY['user experience design', 'ux research', 'user research']),
('UI/UX Design', 'ui-ux-design', 'Design', ARRAY['product design', 'digital design', 'ui ux']),
('Logo Design', 'logo-design', 'Design', ARRAY['logo creation', 'brand mark', 'logodesign']),
('Brand Identity', 'brand-identity', 'Design', ARRAY['branding', 'brand design', 'brand strategy']),
('Illustration', 'illustration', 'Design', ARRAY['digital illustration', 'drawing', 'vector illustration']),
('Photography', 'photography', 'Design', ARRAY['photo', 'fotography', 'fotografija', 'photografy']),
('Video Editing', 'video-editing', 'Design', ARRAY['video production', 'video editing software', 'premiere', 'final cut']),
('Motion Graphics', 'motion-graphics', 'Design', ARRAY['motion design', 'animation', 'after effects']),
('3D Modeling', 'three-d-modeling', 'Design', ARRAY['3d design', 'blender', '3d art', 'cad', '3d modeling']),
('Figma', 'figma', 'Design', ARRAY['figma design', 'figma prototyping']),
('Photoshop', 'photoshop', 'Design', ARRAY['adobe photoshop', 'photo editing', 'ps']),
('Illustrator', 'illustrator', 'Design', ARRAY['adobe illustrator', 'vector design', 'ai']),
('Canva', 'canva', 'Design', ARRAY['canva design', 'canva graphics']),
('Print Design', 'print-design', 'Design', ARRAY['print layout', 'indesign', 'poster design']),
('Typography', 'typography', 'Design', ARRAY['type design', 'font design']),
('Interior Design', 'interior-design', 'Design', ARRAY['interior decoration', 'interior decorating', 'space design']),
('Architecture', 'architecture', 'Design', ARRAY['architectural design', 'building design']),
('Fashion Design', 'fashion-design', 'Design', ARRAY['clothing design', 'fashion illustration']),

-- ============================================================
-- MUSIC
-- ============================================================
('Guitar', 'guitar', 'Music', ARRAY['acoustic guitar', 'electric guitar', 'classical guitar', 'gitara']),
('Piano / Keyboard', 'piano-keyboard', 'Music', ARRAY['piano', 'keyboard', 'keys', 'klasicni klavir']),
('Drums / Percussion', 'drums-percussion', 'Music', ARRAY['drums', 'drumming', 'percussion', 'bubnjevi']),
('Bass Guitar', 'bass-guitar', 'Music', ARRAY['bass', 'electric bass']),
('Singing / Vocals', 'singing-vocals', 'Music', ARRAY['vocals', 'singing', 'voice', 'pjevanje']),
('Music Production', 'music-production', 'Music', ARRAY['music producing', 'beatmaking', 'producing music', 'ableton', 'fl studio', 'logic pro']),
('DJ / Mixing', 'dj-mixing', 'Music', ARRAY['djing', 'dj', 'mixing', 'turntablism']),
('Music Theory', 'music-theory', 'Music', ARRAY['music fundamentals', 'music notation', 'solfege']),
('Violin', 'violin', 'Music', ARRAY['viola', 'fiddle', 'violina']),
('Saxophone', 'saxophone', 'Music', ARRAY['sax']),
('Trumpet / Brass', 'trumpet-brass', 'Music', ARRAY['trumpet', 'brass instruments', 'trombone', 'french horn']),
('Ukulele', 'ukulele', 'Music', ARRAY['uke']),
('Sound Engineering', 'sound-engineering', 'Music', ARRAY['audio engineering', 'sound design', 'mixing mastering', 'recording']),
('Songwriting', 'songwriting', 'Music', ARRAY['song writing', 'lyric writing', 'composing']),

-- ============================================================
-- LANGUAGES
-- ============================================================
('English', 'english', 'Languages', ARRAY['engleski', 'english language', 'english tutoring']),
('Spanish', 'spanish', 'Languages', ARRAY['espanol', 'spanjolski', 'castilian']),
('French', 'french', 'Languages', ARRAY['francais', 'francuski']),
('German', 'german', 'Languages', ARRAY['deutsch', 'njemacki']),
('Italian', 'italian', 'Languages', ARRAY['italiano', 'talijanski']),
('Croatian', 'croatian', 'Languages', ARRAY['hrvatski', 'croatian language']),
('Portuguese', 'portuguese', 'Languages', ARRAY['portugues', 'brazilian portuguese']),
('Japanese', 'japanese', 'Languages', ARRAY['nihongo', 'japonski']),
('Chinese (Mandarin)', 'chinese-mandarin', 'Languages', ARRAY['mandarin', 'chinese', 'putonghua']),
('Arabic', 'arabic', 'Languages', ARRAY['arabski', 'arabic language']),
('Russian', 'russian', 'Languages', ARRAY['russkiy', 'ruski']),
('Korean', 'korean', 'Languages', ARRAY['hangul', 'korejski']),
('Dutch', 'dutch', 'Languages', ARRAY['nederlands', 'nizozemski']),
('Turkish', 'turkish', 'Languages', ARRAY['turkce', 'turski']),
('Polish', 'polish', 'Languages', ARRAY['polski', 'poljski']),
('Sign Language', 'sign-language', 'Languages', ARRAY['asl', 'bsl', 'znakovni jezik']),

-- ============================================================
-- BUSINESS & MARKETING
-- ============================================================
('Marketing', 'marketing', 'Business', ARRAY['digital marketing', 'online marketing', 'marketing strategy']),
('Social Media Marketing', 'social-media-marketing', 'Business', ARRAY['smm', 'social media management', 'social media']),
('Content Marketing', 'content-marketing', 'Business', ARRAY['content strategy', 'content creation']),
('Email Marketing', 'email-marketing', 'Business', ARRAY['newsletter marketing', 'email campaigns']),
('Copywriting', 'copywriting', 'Business', ARRAY['copy writing', 'sales copy', 'content writing']),
('SEO / Content SEO', 'seo-content', 'Business', ARRAY['search engine optimization', 'blog seo', 'on-page seo']),
('Public Relations', 'public-relations', 'Business', ARRAY['pr', 'press releases', 'media relations']),
('Accounting / Bookkeeping', 'accounting-bookkeeping', 'Business', ARRAY['accounting', 'bookkeeping', 'financial accounting', 'racunovodstvo']),
('Financial Planning', 'financial-planning', 'Business', ARRAY['personal finance', 'budgeting', 'investment basics']),
('Project Management', 'project-management', 'Business', ARRAY['pm', 'agile', 'scrum', 'project manager']),
('Business Strategy', 'business-strategy', 'Business', ARRAY['startup strategy', 'business planning', 'business development']),
('Sales', 'sales', 'Business', ARRAY['selling', 'sales strategy', 'b2b sales', 'sales skills']),
('Public Speaking', 'public-speaking', 'Business', ARRAY['presentation skills', 'speaking', 'oratory']),
('Entrepreneurship', 'entrepreneurship', 'Business', ARRAY['startup', 'founder skills', 'business ownership']),
('Legal Basics', 'legal-basics', 'Business', ARRAY['contracts basics', 'business law basics', 'legal writing']),
('Product Management', 'product-management', 'Business', ARRAY['product manager', 'product strategy', 'roadmapping']),
('Human Resources', 'human-resources', 'Business', ARRAY['hr', 'recruiting', 'talent management']),
('Excel / Spreadsheets', 'excel-spreadsheets', 'Business', ARRAY['excel', 'google sheets', 'spreadsheets', 'microsoft excel']),

-- ============================================================
-- SPORTS & FITNESS
-- ============================================================
('Personal Training', 'personal-training', 'Sports & Fitness', ARRAY['fitness coaching', 'strength training', 'workout training']),
('Yoga', 'yoga', 'Sports & Fitness', ARRAY['yoga teaching', 'yoga practice', 'hatha yoga', 'vinyasa']),
('Pilates', 'pilates', 'Sports & Fitness', ARRAY['mat pilates', 'pilates instructor']),
('Martial Arts', 'martial-arts', 'Sports & Fitness', ARRAY['bjj', 'kickboxing', 'karate', 'judo', 'mma', 'self defense', 'boxing']),
('Swimming', 'swimming', 'Sports & Fitness', ARRAY['swim coaching', 'competitive swimming']),
('Rock Climbing', 'rock-climbing', 'Sports & Fitness', ARRAY['climbing', 'bouldering', 'sport climbing']),
('Running / Athletics', 'running-athletics', 'Sports & Fitness', ARRAY['running coaching', 'marathon', 'track and field']),
('Cycling', 'cycling', 'Sports & Fitness', ARRAY['road cycling', 'mountain biking', 'bike coaching']),
('Tennis', 'tennis', 'Sports & Fitness', ARRAY['tennis coaching', 'tennis lessons']),
('Football / Soccer', 'football-soccer', 'Sports & Fitness', ARRAY['soccer', 'football coaching', 'football skills']),
('Basketball', 'basketball', 'Sports & Fitness', ARRAY['basketball coaching']),
('Dance', 'dance', 'Sports & Fitness', ARRAY['dancing', 'salsa', 'bachata', 'hip hop dance', 'ballet', 'contemporary dance']),
('Nutrition / Dietetics', 'nutrition-dietetics', 'Sports & Fitness', ARRAY['nutrition advice', 'diet planning', 'healthy eating']),
('Meditation / Mindfulness', 'meditation-mindfulness', 'Sports & Fitness', ARRAY['meditation', 'mindfulness', 'breathwork']),

-- ============================================================
-- CRAFTS & MAKING
-- ============================================================
('Woodworking', 'woodworking', 'Crafts', ARRAY['carpentry', 'wood craft', 'furniture making']),
('3D Printing', 'three-d-printing', 'Crafts', ARRAY['3d print', 'additive manufacturing', 'fdm printing']),
('Sewing / Tailoring', 'sewing-tailoring', 'Crafts', ARRAY['sewing', 'tailoring', 'garment making', 'hand sewing']),
('Knitting / Crocheting', 'knitting-crocheting', 'Crafts', ARRAY['knitting', 'crochet', 'yarn craft']),
('Ceramics / Pottery', 'ceramics-pottery', 'Crafts', ARRAY['pottery', 'ceramics', 'wheel throwing']),
('Jewelry Making', 'jewelry-making', 'Crafts', ARRAY['jewellery making', 'silversmithing', 'beading']),
('Leatherwork', 'leatherwork', 'Crafts', ARRAY['leather craft', 'leatherworking']),
('Electronics / Soldering', 'electronics-soldering', 'Crafts', ARRAY['electronics', 'soldering', 'circuit building']),
('Home Repair / DIY', 'home-repair-diy', 'Crafts', ARRAY['diy', 'home maintenance', 'plumbing basics', 'electrical basics']),
('Painting', 'painting', 'Crafts', ARRAY['oil painting', 'watercolor', 'acrylic painting', 'canvas painting']),

-- ============================================================
-- COOKING & FOOD
-- ============================================================
('Cooking', 'cooking', 'Cooking & Food', ARRAY['cooking skills', 'home cooking', 'meal prep']),
('Baking', 'baking', 'Cooking & Food', ARRAY['bread baking', 'pastry', 'cake baking']),
('Vegan / Plant-Based Cooking', 'vegan-cooking', 'Cooking & Food', ARRAY['vegan cooking', 'plant based cooking', 'vegetarian cooking']),
('Coffee / Barista Skills', 'barista-coffee', 'Cooking & Food', ARRAY['barista', 'espresso', 'latte art', 'coffee brewing']),
('Fermentation', 'fermentation', 'Cooking & Food', ARRAY['sourdough', 'kombucha', 'fermented foods', 'kimchi']),
('Wine & Spirits', 'wine-spirits', 'Cooking & Food', ARRAY['wine tasting', 'wine knowledge', 'cocktails', 'mixology']),
('Nutrition Cooking', 'nutrition-cooking', 'Cooking & Food', ARRAY['healthy cooking', 'meal planning']),

-- ============================================================
-- ACADEMIC
-- ============================================================
('Mathematics', 'mathematics', 'Academic', ARRAY['math', 'maths', 'matematika', 'algebra', 'calculus']),
('Physics', 'physics', 'Academic', ARRAY['fizika', 'applied physics']),
('Chemistry', 'chemistry', 'Academic', ARRAY['kemija', 'organic chemistry', 'biochemistry']),
('Biology', 'biology', 'Academic', ARRAY['biologija', 'life sciences']),
('Statistics', 'statistics', 'Academic', ARRAY['stats', 'probability', 'statistical analysis']),
('Programming Basics', 'programming-basics', 'Academic', ARRAY['coding basics', 'intro to programming', 'learn to code', 'beginner programming']),
('Essay / Academic Writing', 'academic-writing', 'Academic', ARRAY['essay writing', 'academic writing', 'research writing']),
('History', 'history', 'Academic', ARRAY['world history', 'local history', 'povijest']),
('Philosophy', 'philosophy', 'Academic', ARRAY['filozofija', 'ethics', 'logic']),
('Economics', 'economics', 'Academic', ARRAY['microeconomics', 'macroeconomics', 'ekonomija']),
('Psychology', 'psychology', 'Academic', ARRAY['psihologija', 'behavioral psychology', 'cognitive psychology'])

ON CONFLICT (slug) DO NOTHING;
