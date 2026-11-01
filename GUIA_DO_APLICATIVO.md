# 🇯🇵 Nipponic — Guia Completo e Funcionalidades

O **Nipponic** é uma plataforma desenvolvida para tornar o aprendizado autodidata da língua japonesa eficiente, imersivo e sustentável a longo prazo.

Em vez de memorização mecânica ou listas soltas de vocabulário, o aplicativo une os métodos mais eficazes de aquisição de linguagem: **mineração de frases reais (Sentence Mining)**, **leitura assistida com furigana**, **repetição espaçada inteligente (SRS)**, **prática de pronúncia por imitação (Shadowing)**, **aulas guiadas por níveis de proficiência (Tutor)** e **capacidade total de estudo offline**.

Este documento apresenta em detalhes todos os conceitos do aplicativo e como cada funcionalidade opera no dia a dia do estudante.

---

## 📌 Sumário

1. [Filosofia de Aprendizado do Nipponic](#1-filosofia-de-aprendizado-do-nipponic)
2. [Estrutura da Plataforma e Navegação](#2-estrutura-da-plataforma-e-navegação)
3. [Caderno Inteligente & Análise de Texto (Notes)](#3-caderno-inteligente--análise-de-texto-notes)
   - [Ambiente Bilíngue Lado a Lado](#ambiente-bilíngue-lado-a-lado)
   - [Leitura com Furigana Dinâmico](#leitura-com-furigana-dinâmico)
   - [Dicionário Instantâneo por Palavra](#dicionário-instantâneo-por-palavra)
   - [Detalhamento Completo de Kanjis (Kanji Breakdown)](#detalhamento-completo-de-kanjis-kanji-breakdown)
   - [Mineração de Frases em 1 Clique (Sentence Mining)](#mineração-de-frases-em-1-clique-sentence-mining)
   - [Glossário de Termos Personalizado](#glossário-de-termos-personalizado)
4. [Estúdio de Prática de Shadowing (Pronúncia & Fala)](#4-estúdio-de-prática-de-shadowing-pronúncia--fala)
   - [O Método Shadowing](#o-método-shadowing)
   - [Divisão em Sentenças e Controle de Velocidade](#divisão-em-sentenças-e-controle-de-velocidade)
   - [Gravação de Voz com Ondas em Tempo Real](#gravação-de-voz-com-ondas-em-tempo-real)
   - [Modo de Comparação Imediata de Áudio](#modo-de-comparação-imediata-de-áudio)
5. [Baralhos e Repetição Espaçada (SRS Flashcards)](#5-baralhos-e-repetição-espaçada-srs-flashcards)
   - [Como Funciona o Sistema de Repetição Espaçada](#como-funciona-o-sistema-de-repetição-espaçada)
   - [Os Três Estágios da Memória: Novos, Aprendizado e Maduros](#os-três-estágios-da-memória-novos-aprendizado-e-maduros)
   - [Categorias de Baralhos (Meus Baralhos, Oficiais e Comunitários)](#categorias-de-baralhos-meus-baralhos-oficiais-e-comunitários)
   - [O Reprodutor Interativo de Flashcards (Player)](#o-reprodutor-interativo-de-flashcards-player)
   - [As 4 Opções de Avaliação e Previsão de Intervalo](#as-4-opções-de-avaliação-e-previsão-de-intervalo)
6. [Tutor de Japonês e Trilha Guiada (AI Tutor)](#6-tutor-de-japonês-e-trilha-guiada-ai-tutor)
   - [Classificação por Níveis JLPT (N5 a N1)](#classificação-por-níveis-jlpt-n5-a-n1)
   - [Organização em Unidades e Tópicos](#organização-em-unidades-e-tópicos)
   - [O Ciclo de Aprendizado em 4 Etapas: Teoria, Diálogo, Exercícios e Vocabulário](#o-ciclo-de-aprendizado-em-4-etapas-teoria-diálogo-exercícios-e-vocabulário)
   - [Tipos de Exercícios Interativos](#tipos-de-exercícios-interativos)
   - [Geração Dinâmica e Adaptação Pedagógica](#geração-dinâmica-e-adaptação-pedagógica)
7. [Painel de Estatísticas e Progresso (Stats)](#7-painel-de-estatísticas-e-progresso-stats)
   - [Ofensiva de Estudos Diária (Streak)](#ofensiva-de-estudos-diária-streak)
   - [Metas Diárias e Taxa de Retenção](#metas-diárias-e-taxa-de-retenção)
   - [Mapa Anual de Consistência (Heatmap 365 Dias)](#mapa-anual-de-consistência-heatmap-365-dias)
   - [Distribuição do Conhecimento](#distribuição-do-conhecimento)
8. [Estudo Offline e Sincronização Inteligente](#8-estudo-offline-e-sincronização-inteligente)
   - [Estude em Qualquer Lugar sem Internet](#estude-em-qualquer-lugar-sem-internet)
   - [Fila Automática de Sincronização](#fila-automática-de-sincronização)
   - [Indicador Discreto de Conectividade](#indicador-discreto-de-conectividade)
9. [Mobilidade, Notificações e Hábitos](#9-mobilidade-notificações-e-hábitos)
   - [Design Mobile-First e Telas Compactas](#design-mobile-first-e-telas-compactas)
   - [Lembretes Programados no Dispositivo](#lembretes-programados-no-dispositivo)
10. [Personalização, Temas e Apoio à Comunidade](#10-personalização-temas-e-apoio-à-comunidade)
    - [Gerenciador Central de Cartões](#gerenciador-central-de-cartões)
    - [Temas Visuais (Claro, Escuro e Sistema)](#temas-visuais-claro-escuro-e-sistema)
    - [Mural e Distintivos de Apoiadores (Sponsors)](#mural-e-distintivos-de-apoiadores-sponsors)

---

## 1. Filosofia de Aprendizado do Nipponic

Aprender japonês apresenta desafios específicos: três sistemas de escrita diferentes (Hiragana, Katakana e Kanji), ausência de espaços entre as palavras, conjugações verbais baseadas em polidez e um acento tonal sutil.

O Nipponic foi concebido a partir de quatro pilares fundamentais:

1. **Contexto Real (Comprehensible Input):** O vocabulário é absorvido com muito mais facilidade quando está dentro de frases e situações reais, e não em listas descontextualizadas.
2. **Autonomia com Apoio Instantâneo:** O aluno pode ler textos autênticos em japonês sem a frustração de ter que abrir dicionários externos a cada palavra, pois o significado, leituras e kanjis estão a um clique de distância.
3. **Memória de Longo Prazo:** O cérebro só retém o que é revisado nos momentos exatos de quase esquecimento. A repetição espaçada elimina o esforço inútil de revisar o que já foi dominado e foca no que precisa de reforço.
4. **Produção Oral Ativa:** A leitura silenciosa não desenvolve a musculatura vocal nem a entonação correta; o treino de Shadowing fecha a lacuna entre ler e falar com naturalidade.

---

## 2. Estrutura da Plataforma e Navegação

O aplicativo organiza o estudo em quatro áreas de trabalho principais, acessíveis por uma barra lateral no computador ou por uma barra inferior ergonômica nos celulares:

- **Caderno (Notes):** Onde você escreve, traduz, lê textos japoneses, analisa palavras e extrai novos cartões.
- **Baralhos (Flashcards / Decks):** O centro de memorização com repetição espaçada, onde você revisa cartões, gerencia baralhos próprios ou explora conteúdos prontos.
- **Tutor (AI Tutor):** Uma trilha de aulas estruturadas dividida por níveis de proficiência (do básico N5 ao avançado N1), com gramática, diálogos de exemplo e exercícios de fixação.
- **Estatísticas (Stats):** O painel de progresso que mede sua consistência diária, taxa de acertos e evolução da memória ao longo de todo o ano.

---

## 3. Caderno Inteligente & Análise de Texto (Notes)

O Caderno de Estudos é o coração da leitura e da criação de vocabulário no Nipponic. Ele funciona como um diário de imersão e um laboratório de texto.

### Ambiente Bilíngue Lado a Lado

- Permite escrever um texto em sua língua de preferência (inglês ou português) e em japonês, posicionados lado a lado (em telas maiores) ou empilhados (em celulares).
- Oferece tradução contextual inteligente com um clique: você pode redigir suas anotações ou frases do dia a dia e gerar a versão em japonês, ou colar um texto em japonês para obter a tradução correspondente.
- A direção da tradução pode ser invertida a qualquer momento.

### Leitura com Furigana Dinâmico

- Kanjis em textos contínuos frequentemente geram dúvidas sobre qual leitura utilizar naquele contexto específico.
- O modo de leitura do caderno analisa as palavras e posiciona automaticamente pequenas anotações em **Hiragana** sobre cada Kanji (o chamado _Furigana_).
- O estudante pode ativar ou desativar o Furigana a qualquer momento através de um botão com ícone de olho. Alunos iniciantes se apoiam no Furigana para não travar na leitura, enquanto alunos mais experientes podem ocultá-lo para testar o reconhecimento visual direto dos ideogramas.

### Dicionário Instantâneo por Palavra

- Como o japonês não utiliza espaços entre as palavras, o caderno segmenta o texto em vocábulos individuais.
- Ao clicar ou tocar em qualquer palavra japonesa no texto, abre-se uma janela com informações completas:
  - **Forma do dicionário:** O infinitivo ou a forma base do verbo ou adjetivo conjugado.
  - **Leitura fonética:** A pronúncia exata em Hiragana.
  - **Classe gramatical:** Se é substantivo, verbo, adjetivo, partícula, etc.
  - **Definições e significados:** Traduções diretas e acepções de uso.
  - **Classificação JLPT:** Identificação se a palavra pertence aos níveis N5 (básico) até N1 (avançado).
  - **Indicador de frequência:** Indica se é um termo de uso comum no cotidiano japonês.
  - **Personalização de significado:** Caso você queira associar uma tradução específica da sua preferência para aquele termo, é possível editar e salvar uma definição própria que fica registrada no seu app.
  - **Junção de palavras compostas:** Se duas palavras adjacentes formarem uma expressão única ou verbo composto, você pode uni-las em um único termo ou separá-las novamente.
  - **Alerta de palavra já aprendida:** O sistema identifica se você já possui um cartão para aquela palavra em seus baralhos, evitando duplicações desnecessárias.

### Detalhamento Completo de Kanjis (Kanji Breakdown)

- Dentro da janela da palavra, é possível inspecionar cada ideograma (Kanji) individualmente.
- Cada Kanji exibe:
  - **Significados principais** associados ao caractere.
  - **Leituras On'yomi:** Leituras de origem chinesa (usadas frequentemente em palavras compostas).
  - **Leituras Kun'yomi:** Leituras nativas japonesas (usadas quando o kanji aparece acompanhado de hiragana).
  - **Leituras Nanori:** Leituras especiais usadas em nomes próprios de pessoas e lugares.
  - **Número de traços:** Quantidade exata de pinceladas para desenhar o ideograma.
  - **Série escolar:** Ano escolar japonês em que a criança aprende o caractere.
  - **Nível JLPT:** Exigência no exame oficial de proficiência.
  - **Palavra-chave Heisig:** Conceito mnemônico amplamente utilizado para memorização visual de kanjis.

### Mineração de Frases em 1 Clique (Sentence Mining)

- A _mineração de frases_ é um dos métodos mais comprovados para retenção duradoura: em vez de decorar uma palavra isolada, você memoriza a palavra ancorada em uma frase que faz sentido para você.
- Ao encontrar qualquer palavra interessante na leitura, você clica no botão de mineração (ícone de tesoura/cartão).
- O aplicativo detecta a frase inteira ao redor da palavra, preenche a pergunta em japonês, a resposta com a leitura e o significado do termo, e permite escolher para qual (ou quais) baralho de flashcards o novo cartão deve ser enviado.

### Glossário de Termos Personalizado

- Para quem traduz temas específicos, jargões ou nomes próprios, o app conta com um glossário de regras de substituição.
- Você pode definir previamente que um termo sempre deve ser traduzido de uma forma pré-estabelecida (por exemplo, garantir que nomes próprios, títulos ou expressões de fantasia mantenham a consistência nas traduções).

---

## 4. Estúdio de Prática de Shadowing (Pronúncia & Fala)

Muitos estudantes conseguem ler e entender textos em japonês, mas travam na hora de falar ou pronunciam com ritmo e entonação robóticos. O Estúdio de Shadowing foi criado para resolver esse ponto.

### O Método Shadowing

- _Shadowing_ (sombreamento) consiste em escutar um áudio falado por um nativo e reproduzi-lo em voz alta quase ao mesmo tempo, imitando a melodia da fala, as pausas, a velocidade e o acento tonal.

### Divisão em Sentenças e Controle de Velocidade

- Ao abrir o estúdio de Shadowing a partir de qualquer nota, o aplicativo fatia o texto em sentenças individuais com sua respectiva tradução.
- Você pode regular a velocidade da fala nativa (de ritmos mais lentos e pausados para quem está começando até a velocidade normal de conversação).
- O botão de áudio nativo reproduz a pronúncia clara de cada frase sob demanda.

### Gravação de Voz com Ondas em Tempo Real

- O estudante conta com um botão de microfone dedicado.
- Ao falar, um gráfico visual de ondas sonoras reage em tempo real à intensidade da sua voz, confirmando a captação.
- Ao terminar, o áudio da sua fala fica imediatamente disponível para audição.

### Modo de Comparação Imediata de Áudio

- Esta é a funcionalidade mais valiosa do estúdio: ao tocar no botão de comparação, o aplicativo toca primeiro o áudio nativo de referência e, logo em seguida, o áudio que você gravou.
- Ouvir as duas versões em sequência direta permite que seu próprio cérebro identifique na hora as diferenças de entonação (acento de tom alto e baixo) e ritmo, permitindo que você regrave quantas vezes quiser até alcançar a pronúncia desejada.
- Conforme avança pelas frases, você marca as concluídas e acompanha seu progresso em toda a lição.

---

## 5. Baralhos e Repetição Espaçada (SRS Flashcards)

O sistema de memorização do Nipponic utiliza a ciência da repetição espaçada para garantir que o vocabulário vá para a memória de longo prazo com o menor número possível de revisões.

### Como Funciona o Sistema de Repetição Espaçada

- Toda vez que aprendemos algo novo, a curva do esquecimento de Ebbinghaus entra em ação: perdemos boa parte da informação nas primeiras horas e dias.
- No entanto, se revisarmos a informação no momento exato em que estamos prestes a esquecê-la, o cérebro a classifica como prioritária e o intervalo de tempo até o próximo esquecimento dobra ou triplica.
- O algoritmo calcula automaticamente:
  - O **fator de facilidade** de cada cartão (cartões difíceis voltam com mais frequência; cartões intuitivos se afastam).
  - O **intervalo em dias** para o próximo contato.
  - A quantidade de **repetições bem-sucedidas** e **lapsos de memória**.

### Os Três Estágios da Memória: Novos, Aprendizado e Maduros

O aplicativo classifica suas cartas em três categorias:

1. **Novas (New):** Cartões recém-adicionados que nunca foram revisados.
2. **Em Aprendizado (Learning):** Cartões que já foram vistos algumas vezes, mas ainda possuem intervalos de repetição curtos (menos de 21 dias). Eles ainda exigem revisões frequentes para consolidação neural.
3. **Maduras (Mature):** Cartões cujos intervalos já ultrapassaram 21 dias, semanas ou meses. Representam o vocabulário dominado e retido na memória profunda.

### Categorias de Baralhos

- **Meus Baralhos (My Decks):** Coleções particulares criadas por você. Você pode nomear, adicionar cartões, reordenar e excluir conforme sua rotina de estudos.
- **Baralhos Oficiais do Aplicativo (App Decks):** Baralhos prontos e selecionados, contendo o vocabulário essencial para os exames de proficiência JLPT e situações cotidianas. Você pode cloná-los para sua biblioteca pessoal com um toque.
- **Baralhos Públicos da Comunidade (Public Decks):** Baralhos compartilhados por outros estudantes, permitindo enriquecer seus estudos com conteúdos colaborativos.

### O Reprodutor Interativo de Flashcards (Player)

Ao iniciar uma sessão de estudo:

- O cartão é apresentado com a face frontal (normalmente a frase ou palavra em japonês).
- É possível ouvir a pronúncia em áudio nativo a qualquer momento.
- Você tenta recordar o significado e a leitura mentalmente.
- Com um toque na tela, clique no cartão ou pela barra de espaço do teclado, o cartão vira e revela a face posterior (tradução, notas explicativas e leituras).
- Ao terminar todos os cartões programados para aquele dia, uma comemoração com confetes e um resumo da sessão é exibido.

### As 4 Opções de Avaliação e Previsão de Intervalo

Diferente de sistemas simplistas de "certo ou errado", cada cartão oferece 4 respostas graduadas, cada uma exibindo previamente em quanto tempo o cartão retornará:

- **Again (De novo):** Você não lembrou da resposta. O cartão volta imediatamente na mesma sessão de estudos até ser memorizado.
- **Hard (Difícil):** Você lembrou, mas com muito esforço ou incerteza. O intervalo aumenta de forma bastante conservadora.
- **Good (Bom):** Você lembrou com segurança no tempo esperado. O intervalo cresce no ritmo padrão ideal.
- **Easy (Fácil):** O cartão foi extremamente fácil e trivial. O intervalo dá um salto maior no futuro, poupando seu tempo para conteúdos mais desafiadores.

---

## 6. Tutor de Japonês e Trilha Guiada (AI Tutor)

Para quem deseja um caminho guiado e organizado do zero ao nível avançado, o Nipponic inclui um ambiente de tutoria pedagógica.

### Classificação por Níveis JLPT (N5 a N1)

A trilha curricular é calibrada de acordo com as exigências dos 5 níveis do Exame de Proficiência na Língua Japonesa (JLPT):

- **N5 (Iniciante Absoluto):** Fundamentos gramaticais, partícula です/ます, perguntas básicas, pronomes demonstrativos e vocabulário essencial do cotidiano.
- **N4 (Básico Superior):** Formas casuais (dicionário, negativa e passada), condicionais simples, potencial e sentenças compostas.
- **N3 (Intermediário):** Transição para conversação natural, distinções sutis de intenção do falante e expressões idiomáticas de uso diário.
- **N2 (Intermediário Avançado):** Japonês formal, linguagem corporativa, artigos jornalísticos e estruturas de registro escrito.
- **N1 (Avançado / Quase Nativo):** Nuances literárias, clássicas, expressões de alta sofisticação e comunicação formal profunda.

### Organização em Unidades e Tópicos

O currículo de cada nível é organizado em unidades temáticas bem definidas (por exemplo: _Fundações e Cumprimentos_, _Vida Diária e Verbos Básicos_, etc.), cada uma contendo lições individuais com objetivos de aprendizado específicos.

### O Ciclo de Aprendizado em 4 Etapas

Cada lição do tutor segue uma sequência didática comprovada:

1. **Teoria (Theory):**
   - Explicação clara e estruturada da regra gramatical ou do conceito.
   - Exemplos práticos com leitura em Furigana e tradução.
   - Detalhamento de quando e como utilizar a estrutura, além dos erros comuns cometidos por estrangeiros.

2. **Diálogo Realista (Dialogue):**
   - Uma conversa natural entre dois personagens aplicando a gramática aprendida em uma situação plausível.
   - Cada fala possui áudio individual sob demanda para treinar a audição e tradução bilíngue.

3. **Exercícios Interativos (Exercises):**
   - O estudante coloca em prática o que acabou de ler antes de passar para a próxima lição.
   - O sistema corrige na hora e apresenta explicações pedagógicas sobre a resposta certa.

4. **Vocabulário da Lição (Vocabulary):**
   - Lista compilada de todas as palavras novas introduzidas naquela lição.
   - Um botão de lote permite adicionar todas as palavras aprendidas diretamente aos seus baralhos de flashcards com um clique, garantindo que o vocabulário não se perca.

### Tipos de Exercícios Interativos

- **Múltipla Escolha (Multiple Choice):** Identificar a partícula correta, a conjugação apropriada ou a melhor resposta para uma frase.
- **Preenchimento de Lacunas (Fill in the Blank):** Digitar ou selecionar a palavra que falta para completar a frase no sentido pretendido.
- **Reordenação de Frases (Sentence Reordering):** Organizar blocos soltos de palavras na ordem sintática correta do japonês.

### Geração Dinâmica e Adaptação Pedagógica

- Ao final de cada lição, o aluno pode avaliar se o conteúdo foi claro ou confuso e deixar comentários.
- Essas avaliações alimentam a geração de novas unidades e tópicos, ajustando o nível de profundidade e exemplos às necessidades reais do estudante.

---

## 7. Painel de Estatísticas e Progresso (Stats)

Manter a motivação ao estudar um idioma difícil depende de enxergar o próprio avanço. O Painel de Estatísticas do Nipponic substitui a sensação de estagnação por dados concretos de evolução.

### Ofensiva de Estudos Diária (Streak)

- Exibe o contador de dias consecutivos em que você praticou no aplicativo (com o ícone de chama).
- Indica se você já cumpriu o estudo de hoje ou se ainda precisa revisar para manter a sequência ativa.
- Incentiva o hábito de revisar um pouco todos os dias, que é comprovadamente superior a estudar muitas horas em um único dia da semana.

### Metas Diárias e Taxa de Retenção

- **Revisões Concluídas vs. Meta:** Acompanha quantos cartões foram revisados no dia atual em relação à sua meta pretendida (por exemplo, meta de 20 revisões diárias).
- **Taxa de Retenção (%):** Mede a porcentagem de cartões respondidos com sucesso (_Good_ ou _Easy_) contra os que precisaram de reforço (_Again_), dando uma visão realista da saúde da sua memória.

### Mapa Anual de Consistência (Heatmap 365 Dias)

- Uma grade visual com 365 pequenos blocos representando todos os dias do ano (semelhante ao mapa de contribuição do GitHub).
- Cada dia muda de cor de acordo com a quantidade de cartões estudados, permitindo visualizar com orgulho meses inteiros de dedicação ininterrupta.

### Distribuição do Conhecimento

- Gráficos que detalham:
  - Quantos cartões estão prontos para revisão hoje (_Due Today_).
  - Quantos cartões são novos, quantos estão na fase de aprendizado e quantos já são maduros.
  - Histórico de proporção entre as avaliações _Again_, _Hard_, _Good_ e _Easy_.

---

## 8. Estudo Offline e Sincronização Inteligente

Muitos momentos propícios para estudar japonês acontecem em trânsito: dentro do metrô, em viagens de avião ou em locais com internet instável. O Nipponic foi planejado para operar de ponta a ponta sem depender de conexão contínua.

### Estude em Qualquer Lugar sem Internet

- Os baralhos e as cartas salvos no seu aparelho ficam armazenados na memória local do dispositivo.
- Você pode abrir o aplicativo sem internet, repassar dezenas de cartões, virar faces e avaliar respostas normalmente.

### Fila Automática de Sincronização

- Todas as avaliações de cartões e alterações feitas enquanto você estiver desconectado são guardadas em uma fila de sincronização segura em segundo plano.
- No instante em que o seu celular ou computador detectar sinal de internet novamente, o aplicativo sincroniza automaticamente o histórico com os servidores em nuvem, sem exibir telas de erro e sem perder nenhuma revisão realizada.

### Indicador Discreto de Conectividade

- Sempre que você estiver offline, um selo visual discreto informa que o modo de estudo local está em operação.
- Ao reconectar, o selo avisa quando os dados pendentes forem sincronizados com sucesso.

---

## 9. Mobilidade, Notificações e Hábitos

### Design Mobile-First e Telas Compactas

- A interface foi projetada desde o primeiro rascunho para uso confortável em smartphones com uma só mão.
- Todos os botões principais, controles de áudio e cartões respeitam áreas de toque ergonômicas e funcionam em qualquer tamanho de tela (inclusive aparelhos estreitos de até 320px de largura).
- Nos celulares, a navegação é feita por uma barra inferior fixa com acesso rápido aos 4 pilares: Caderno, Baralhos, Tutor e Estatísticas.

### Lembretes Programados no Dispositivo

- Para ajudar a manter a disciplina, o aplicativo conta com agendamento de notificações locais no próprio aparelho.
- Você pode definir o horário preferido do dia para receber um aviso lembrando de fazer a revisão diária e não deixar cartas acumularem.

---

## 10. Personalização, Temas e Apoio à Comunidade

### Gerenciador Central de Cartões

- Além de visualizar cartões dentro de cada baralho, o menu de configurações possui uma aba geral de cartões.
- Permite pesquisar em tempo real por qualquer termo em japonês ou tradução, verificar quando o cartão voltará para revisão, corrigir erros de digitação ou remover cartas obsoletas.

### Temas Visuais (Claro, Escuro e Sistema)

- Suporte nativo ao modo escuro (_Dark Mode_), ideal para estudar à noite sem fadiga visual, modo claro (_Light Mode_) e sincronização com o tema padrão do sistema operacional do seu dispositivo.

### Mural e Distintivos de Apoiadores (Sponsors)

- O projeto conta com integração voluntária ao GitHub Sponsors para quem deseja apoiar o desenvolvimento contínuo da plataforma.
- Existem categorias temáticas de contribuição (🌱 _Green Tea_, 🍱 _Bento Box_, 🍜 _Premium Ramen_).
- Estudantes apoiadores podem vincular seu usuário do GitHub e receber distintivos visuais especiais de reconhecimento em seu perfil dentro da plataforma.

---

## Resumo das Vantagens do Nipponic

| Desafio no Japonês                              | Solução Oferecida pelo Nipponic                                                                               |
| :---------------------------------------------- | :------------------------------------------------------------------------------------------------------------ |
| **Kanjis desconhecidos travam a leitura**       | Furigana dinâmico ativável com um clique e dicionário instantâneo com traços, leituras e mnemônicos.          |
| **Vocabulário isolado é esquecido rapidamente** | Mineração de frases (Sentence Mining) capturando o contexto da frase inteira para um flashcard com um clique. |
| **Revisar tudo todo dia toma muito tempo**      | Algoritmo de repetição espaçada (SRS) que programa revisões apenas quando você está prestes a esquecer.       |
| **Dificuldade de pronúncia e acento tonal**     | Estúdio de Shadowing com áudio nativo, gravação de voz e comparação instantânea lado a lado.                  |
| **Falta de direcionamento gramatical**          | Tutor estruturado do JLPT N5 ao N1 com lições passo a passo em teoria, diálogo e exercícios.                  |
| **Perda de tempo em deslocamentos sem sinal**   | Arquitetura com estudo offline completo e sincronização automática em segundo plano.                          |

---

_O Nipponic foi feito por e para quem ama a língua japonesa, colocando a eficácia cognitiva e a praticidade a serviço do seu aprendizado diário._
